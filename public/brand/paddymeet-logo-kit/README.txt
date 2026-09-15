PADDYMEET LOGO KIT
===================

COLORS
------
Navy (primary text / icon):      #101828
Orange (accent / "meet"):        #FF6900
Orange-soft (2nd crew dot):      #FF9043
White:                            #FFFFFF

TYPEFACE
--------
Poppins, Bold (700) — free on Google Fonts:
https://fonts.google.com/specimen/Poppins
(This is a close match to your original reference wordmark, not a
pixel-identical clone. If you have the exact original font file,
swap it in for the wordmark.)

WHAT'S IN THIS KIT
-------------------
/svg/                     Editable vector source files (open in Figma,
                          Illustrator, Inkscape, or any code editor —
                          these scale to any size with no quality loss)
  icon-color.svg          Pin icon, navy pin / orange dots — for light backgrounds
  icon-white.svg          Pin icon, white pin / orange dots — for dark backgrounds
  icon-dots-only.svg      Just the 3 crew-dots — for very small spaces (social avatars)
  wordmark-color.svg      "paddymeet" text only — for light backgrounds
  wordmark-white.svg      "paddymeet" text only — for dark backgrounds
  logo-horizontal-color.svg   Icon + wordmark side by side — light backgrounds
  logo-horizontal-white.svg   Icon + wordmark side by side — dark backgrounds
  logo-stacked-color.svg      Icon above wordmark — light backgrounds
  logo-stacked-white.svg      Icon above wordmark — dark backgrounds

/icon-color/, /icon-white/, /icon-dots-only/
                          PNG exports of each icon at 16, 32, 64, 128,
                          256, 512, 1024px — transparent background

favicon.ico               Multi-size favicon (16/32/48/64px) for your website tab
apple-touch-icon-180.png  180x180 icon on solid navy background — for iOS home screen
app-icon-1024-navy-bg.png 1024x1024 icon on solid navy background — for app store submission
                          (no transparency, as app stores require)

paddymeet-wordmark-*.png          Text-only logo, transparent, 3 sizes, color + white
paddymeet-logo-horizontal-*.png   Full horizontal lockup, transparent, 3 sizes, color + white
paddymeet-logo-stacked-*.png      Full stacked lockup, transparent, 2 sizes, color + white

WHEN TO USE WHICH FILE
------------------------
- Website navbar / header:        logo-horizontal-color.svg (or the PNG if your
                                   build tool doesn't support SVG)
- Website favicon:                favicon.ico
- Mobile app icon / app store:    app-icon-1024-navy-bg.png
- iOS "add to home screen":       apple-touch-icon-180.png
- Dark-mode sections / footer:    any "-white" file
- Social media profile picture:   icon-color (square crop) or icon-dots-only
                                   at 512px or 1024px
- Merch, signage, print:          the SVG files — vector, scales to any size

USAGE LOGIC
------------
The pin shape always inverts with the background (navy pin on light
surfaces, white pin on dark surfaces). The three crew-dots always stay
in the same sequence — orange, orange-soft, then whatever contrasts
(white or navy) — so the "crew" idea keeps its color identity in every
version.
