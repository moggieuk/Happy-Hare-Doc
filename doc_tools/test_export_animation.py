"""Check the downloadable copy stays in sync with the maintained player."""

import unittest

from doc_tools.export_animation import ROOT, render


class AnimationExportTests(unittest.TestCase):
    def test_committed_download_matches_sources(self):
        target = ROOT / "doc/Macro-Toolhead-Tip-Cutting/tip-cutting-purge.html"
        self.assertEqual(target.read_text(), render("tip-cutting-purge"))

    def test_export_is_offline(self):
        html = render("tip-cutting-purge")
        self.assertNotRegex(html, r'<(?:script|link)[^>]+(?:src|href)=')
        self.assertIn('data-hh-animation="tip-cutting-purge"', html)
        self.assertIn('data:image/png;base64,', html)
        self.assertNotIn('../images/favicon.png', html)

    def test_scene_name_cannot_escape_asset_directory(self):
        for name in ("../other", "/tmp/other", "<script>", "", "MixedCase"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                render(name)


if __name__ == "__main__":
    unittest.main()
