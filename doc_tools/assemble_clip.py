# Happy Hare documentation tooling
#
# Turns the timestamped screencast frames written by capture_viewer.mjs into a small
# looping animated WebP: crop to a region, scale down, resample to a fixed rate, and
# merge runs of identical frames into one longer frame so a mostly-still scene costs
# almost nothing.
#
#   python doc_tools/assemble_clip.py FRAMES.json OUT.webp --crop X,Y,W,H [--scale 0.7]
#                                     [--fps 10] [--quality 60] [--hold 1.5]
#
# FRAMES.json is a list of {"t": seconds, "file": path} in time order.
#
# This file may be distributed under the terms of the GNU GPLv3 license.

import argparse
import hashlib
import json
import sys

from PIL import Image


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('frames')
    p.add_argument('out')
    p.add_argument('--crop', required=True, help='X,Y,W,H in screencast pixels')
    p.add_argument('--scale', type=float, default=0.7)
    p.add_argument('--fps', type=float, default=10)
    p.add_argument('--quality', type=int, default=60)
    p.add_argument('--hold', type=float, default=1.5, help='seconds to hold the last frame before the loop restarts')
    a = p.parse_args(argv)

    frames = json.load(open(a.frames))
    if not frames:
        sys.exit('no frames')
    x, y, w, h = (int(float(v)) for v in a.crop.split(','))
    size = (max(1, round(w * a.scale)), max(1, round(h * a.scale)))
    step = 1.0 / a.fps
    end = frames[-1]['t']

    out, durations, last_key = [], [], None
    cursor, k = 0, 0
    while k * step <= end + 1e-9:
        t = k * step
        while cursor + 1 < len(frames) and frames[cursor + 1]['t'] <= t:
            cursor += 1
        im = Image.open(frames[cursor]['file']).convert('RGB').crop((x, y, x + w, y + h)).resize(size, Image.LANCZOS)
        key = hashlib.md5(im.tobytes()).hexdigest()
        if key == last_key:
            durations[-1] += round(step * 1000)
        else:
            out.append(im)
            durations.append(round(step * 1000))
            last_key = key
        k += 1
    durations[-1] += round(a.hold * 1000)

    out[0].save(a.out, save_all=True, append_images=out[1:], duration=durations, loop=0, quality=a.quality, method=6)
    print('%s: %d frames kept of %d ticks, %.1fs, %d KB' % (a.out, len(out), k, sum(durations) / 1000, __import__('os').path.getsize(a.out) // 1024))


if __name__ == '__main__':
    main()
