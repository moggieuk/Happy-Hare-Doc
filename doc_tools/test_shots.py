"""Regression tests: HAPPY_HARE_SRC=.happy-hare-src venv/bin/python -m unittest doc_tools.test_shots."""
import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from .capture import Menuconfig, PromptIndex, ScreenError, menu_of, symbol
from . import shots


def node(prompt, parent=None, menu=False):
    return SimpleNamespace(prompt=(prompt, None) if prompt else None,
                           parent=parent, is_menuconfig=menu)


class NavigationTests(unittest.TestCase):
    def index(self):
        top = node('Top', menu=True)
        parent = node('Renamed [[B]]motor[[/B]] menu', top, True)
        item = SimpleNamespace(nodes=[node(None), node('Direction   pin', parent)])
        return PromptIndex(SimpleNamespace(syms={'PIN_DIR': item}, named_choices={}, top_node=top))

    def test_labels_and_parent_menus_come_from_current_source(self):
        index = self.index()
        self.assertEqual(index.prompts(symbol('PIN_DIR')), {'Direction pin'})
        self.assertEqual(index.prompts(menu_of('PIN_DIR')), {'Renamed motor menu'})
        index.kconfig.syms['PIN_DIR'].nodes[1].prompt = ('New wording', None)
        self.assertEqual(index.prompts(symbol('PIN_DIR')), {'New wording'})

    def test_removed_symbol_fails_explicitly(self):
        with self.assertRaisesRegex(ScreenError, 'no longer exists'):
            self.index().prompts(symbol('REMOVED'))

    def test_choice_title_does_not_select_a_different_menu_with_same_prefix(self):
        mc = Menuconfig.__new__(Menuconfig)
        mc.prompt_index = self.index()
        mc.prompt_index.kconfig.named_choices['TOOLHEAD'] = SimpleNamespace(nodes=[node('Toolhead')])
        mc.selection = lambda: (2, 'Toolhead sensors/settings  --->')
        def walk(matches, direction, limit):
            self.assertFalse(matches(mc.selected))
            self.assertTrue(matches('Toolhead (Other)  --->'))
            return True
        mc._walk = walk
        mc.select(symbol('TOOLHEAD'))

    def test_symbol_selection_uses_the_full_current_prompt(self):
        mc = Menuconfig.__new__(Menuconfig)
        mc.prompt_index = self.index()
        mc.scroll_arrows = lambda: []
        mc.selection = lambda: (2, '> Direction     pin (unit0:PA4)')
        self.assertIs(mc.select(symbol('PIN_DIR')), mc)
        mc.selection = lambda: (2, '> Another pin (unit0:PA4)')
        def walk(matches, direction, limit):
            self.assertFalse(matches(mc.selected))
            self.assertTrue(matches('> Direction pin (unit0:PA4)'))
            return True
        mc._walk = walk
        self.assertIs(mc.select(symbol('PIN_DIR')), mc)

    def test_startup_failure_closes_child(self):
        mc = Menuconfig.__new__(Menuconfig)
        with patch.object(mc, 'start', side_effect=ScreenError('startup')), patch.object(mc, 'close') as close:
            with self.assertRaises(ScreenError):
                mc.__enter__()
            close.assert_called_once()

    def test_truncated_capture_is_rejected(self):
        mc = Menuconfig.__new__(Menuconfig)
        mc.scroll_arrows = lambda: [(20, '↓')]
        mc.in_editor = lambda: False
        with tempfile.TemporaryDirectory() as root:
            output = Path(root) / 'truncated.png'
            with self.assertRaisesRegex(ScreenError, 'scroll arrows'):
                mc.shot(str(output), fit=False, heal=False)
            self.assertFalse(output.exists())

    def test_unit_editors_and_unknown_editor(self):
        for kind, expected in [('(list)', [b'a', b'unit1\r']),
                               ('(string array)', [b'\x05\runit1'])]:
            mc = Menuconfig.__new__(Menuconfig)
            mc.has = lambda text: text == kind
            mc.screen = SimpleNamespace(cursor=SimpleNamespace(x=5, y=2), display=['unit0'])
            mc.key = lambda *args, **kwargs: mc
            with patch.object(mc, 'step', return_value=mc) as step:
                mc.append_entry('unit1')
                self.assertEqual([call.args[0] for call in step.call_args_list], expected)
        mc.has = lambda text: False
        mc.state = lambda: 'unknown editor'
        with self.assertRaisesRegex(ScreenError, 'Unsupported unit editor'):
            mc.append_entry('unit1')

    def test_unit_list_error_is_not_mistaken_for_success(self):
        mc = Menuconfig.__new__(Menuconfig)
        mc.has = lambda text: text in {'(list)', 'unit1', 'Error'}
        with patch.object(mc, 'step', return_value=mc) as step:
            mc.append_entry('unit1')
            completed = step.call_args.args[1]
            self.assertFalse(completed(mc))
            mc.has = lambda text: text in {'(list)', 'unit1'}
            self.assertTrue(completed(mc))


class PublicationTests(unittest.TestCase):
    def test_duplicate_destinations_are_rejected_before_writing(self):
        with tempfile.TemporaryDirectory() as root:
            dst = Path(root) / 'existing.png'
            dst.write_bytes(b'original')
            with self.assertRaisesRegex(ScreenError, 'same output file'):
                shots.publish_images([('unused', dst), ('unused', dst)])
            self.assertEqual(dst.read_bytes(), b'original')

    def test_failed_rollback_keeps_recovery_copy(self):
        with tempfile.TemporaryDirectory() as root:
            p = Path(root)
            source = p / 'capture.png'; source.write_bytes(b'new')
            first = p / 'first.png'; first.write_bytes(b'original')
            second = p / 'second.png'
            replace = shots.os.replace
            calls = 0
            def fail_after_first(src, dst):
                nonlocal calls
                calls += 1
                if calls > 1:
                    raise OSError('disk unavailable')
                replace(src, dst)
            with patch.object(shots.os, 'replace', side_effect=fail_after_first):
                with self.assertRaisesRegex(ScreenError, 'recovery files retained'):
                    shots.publish_images([(source, first), (source, second)])
            backups = list(p.glob('.hh-shot-*/old.png'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), b'original')

    def test_publish_failure_restores_overwritten_and_new_files(self):
        with tempfile.TemporaryDirectory() as root:
            p = Path(root)
            source = p / 'capture.png'; source.write_bytes(b'new capture')
            existing = p / 'existing.png'; existing.write_bytes(b'old capture')
            added, failing = p / 'added.png', p / 'failing.png'
            replace = shots.os.replace
            def fail_last(src, dst):
                if Path(dst) == failing:
                    raise OSError('disk failure')
                replace(src, dst)
            with patch.object(shots.os, 'replace', side_effect=fail_last):
                with self.assertRaisesRegex(OSError, 'disk failure'):
                    shots.publish_images([(source, existing), (source, added), (source, failing)])
            self.assertEqual(existing.read_bytes(), b'old capture')
            self.assertFalse(added.exists())
            self.assertFalse(failing.exists())

    def test_later_session_failure_publishes_nothing(self):
        with tempfile.TemporaryDirectory() as root:
            dst = Path(root) / 'page' / 'image.png'
            dst.parent.mkdir(); dst.write_bytes(b'existing')
            sessions = [dict(name='good', outdir='page'), dict(name='bad', outdir='page')]
            def capture(session, *args, staging=None):
                if session['name'] == 'bad':
                    raise ScreenError('target missing\nFULL SCREEN DUMP')
                image = Path(staging) / 'good' / 'image.png'
                image.parent.mkdir(); image.write_bytes(b'new')
                return [str(dst)]
            error = io.StringIO()
            with patch.object(shots, 'SESSIONS', sessions), patch.object(shots, 'run_session', side_effect=capture), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(error):
                self.assertEqual(shots.main([]), 1)
            self.assertEqual(dst.read_bytes(), b'existing')
            self.assertIn('No screenshots replaced', error.getvalue())
            self.assertNotIn('FULL SCREEN DUMP', error.getvalue())

    def test_success_publishes_only_requested_sessions_to_output_root(self):
        with tempfile.TemporaryDirectory() as root:
            sessions = [dict(name='good', outdir='page'), dict(name='other', outdir='other')]
            def capture(session, *args, staging=None):
                self.assertEqual(session['name'], 'good')
                image = Path(staging) / 'good' / 'image.png'
                image.parent.mkdir(); image.write_bytes(b'new')
                return [str(Path(session['outdir']) / 'image.png')]
            with patch.object(shots, 'SESSIONS', sessions), patch.object(shots, 'run_session', side_effect=capture), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(shots.main(['--only', 'good', '--output-root', root]), 0)
            self.assertEqual((Path(root) / 'page' / 'image.png').read_bytes(), b'new')
            self.assertFalse((Path(root) / 'other').exists())


if __name__ == '__main__':
    unittest.main()
