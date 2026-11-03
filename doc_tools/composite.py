"""Reproducible toolhead illustrations built entirely from real terminal cells."""
from io import BytesIO

from PIL import Image, ImageChops, ImageDraw

from .capture import ScreenError
from .render import CELL_ASPECT, PAD, _fonts, render


def sensor_section(screen):
    """Find the complete sensor/dimension section, failing if its layout changes."""
    lines = screen.display
    starts = [i for i, line in enumerate(lines) if 'TOOLHEAD SENSORS' in line]
    ends = [i for i, line in enumerate(lines) if 'Unload safety margin' in line]
    if len(starts) != 1 or len(ends) != 1 or ends[0] <= starts[0]:
        raise ScreenError('Cannot identify complete toolhead sensor/dimension section')
    top, bottom = starts[0], ends[0] + 1
    # Ignore decorative divider lengths when measuring actual text.
    width = max(len(line.rstrip()) for line in lines[top:bottom]
                if 'TOOLHEAD SENSORS' not in line and 'TOOLHEAD DIMENSIONS' not in line)
    return top, bottom, width


def faded_connector(base, tip, upper, lower):
    """Fade a triangular alternative-view connector into the original screen."""
    mask = Image.new('L', base.size, 0)
    ImageDraw.Draw(mask).polygon([tip, upper, lower], fill=255)
    gradient = Image.new('L', base.size, 0)
    draw = ImageDraw.Draw(gradient)
    start, end = tip[0], upper[0]
    for x in range(start, end + 1):
        alpha = round(145 * (x - start) / max(1, end - start))
        draw.line((x, upper[1], x, lower[1]), fill=alpha)
    tint = Image.new('RGB', base.size, '#d08b46')
    base.paste(tint, (0, 0), ImageChops.multiply(mask, gradient))


def render_toolhead_composite(before, after, path, scale=2):
    """Keep the base screen intact; inset the enabled section in its blank right side."""
    pad = PAD * scale
    cell_w = _fonts(13 * scale)[0].getlength('M')
    cell_h = int(13 * scale * CELL_ASPECT)
    top, bottom, width = sensor_section(after)
    old_top, old_bottom, old_width = sensor_section(before)
    images = []
    for screen in (before, after):
        stream = BytesIO()
        # render() normally infers PNG from the filename.
        stream.name = 'capture.png'
        render(screen, stream, scale=scale)
        stream.seek(0)
        images.append(Image.open(stream).convert('RGB'))
    base, enabled = images
    inset = enabled.crop((pad, pad + top * cell_h,
                          pad + int((width + 1) * cell_w), pad + bottom * cell_h))
    x = base.width - pad - inset.width
    y = pad + old_top * cell_h
    help_row = next((i for i, line in enumerate(before.display)
                     if line.strip() == 'Help'), before.lines - 8)
    if x < pad + (old_width + 2) * cell_w or y + inset.height >= pad + help_row * cell_h:
        raise ScreenError('Toolhead inset would obscure base text or help; increase capture size')
    start = pad + int((old_width + 1) * cell_w)
    faded_connector(base, (start, pad + (old_top + old_bottom) * cell_h // 2),
                    (x, y), (x, y + inset.height))
    base.paste(inset, (x, y))
    draw = ImageDraw.Draw(base)
    draw.rectangle((x - scale, y - scale, x + inset.width, y + inset.height),
                   outline='#bcbcbc', width=scale)
    base.save(path)
