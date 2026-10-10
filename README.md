# Airplane's Land

A gentle exploring game for Michael. No losing, no timers, no score, no reading.

## Play

Double-click `index.html`.

- **Menu:** six picture cards. Move with the **arrow keys**, press the **space bar** to pick (or click a card).
- **In the world:** Michael walks with the **arrow keys**. Next to a dragon or dino a hand bubble pops up. Press the **space bar** to pat it, again for a trick (dragons breathe rainbow sparkles, dinos twirl and go "rawr"), and again to make it dance.
- **Back to the menu:** the round house button in the bottom-left corner (click it), or **Esc**.
- **Help:** the orange speaker button (above the house button) says the explanation again. Pressing the **space bar** when nothing is nearby does the same. If Michael is stuck for a while, the explanation repeats and a yellow arrow points to the next thing to find.
- Grown-ups: **M** turns all sound on/off, **B** turns only the background music on/off.

**On an iPhone or iPad:** tap a card to pick a game. In the game, tap (or hold your finger) anywhere and Michael walks there; tap a dragon or dino next to him to pat it. The house and speaker buttons work the same. Turn the phone sideways: the game fills the screen even if the app around it stays upright. Sound starts with the first tap, and plays even when the phone's silent switch is on (on iOS 17 and newer). On a phone the game says touch versions of the lines that talk about the keys (the `*_touch` lines).

## Hebrew voice

Every game has a Hebrew name on its card, and the game explains everything out loud in Hebrew: the menu, how to play each game, colors, foods, "you found one!", "well done!". Every sentence also appears as text at the bottom of the screen, so you can read it to him.

The narration is recorded with a Gemini voice (`gemini-2.5-flash-preview-tts`; set `GEMINI_TTS_MODEL` to use another, e.g. `gemini-3.8-flash-lite-tts`). The files are in `assets/voice/` and are remade with `GEMINI_API_KEY=... python3 tools/make_voices.py` (or by running the "Make voice files" GitHub Action, which uses the `GEMINI_API_KEY` repository secret). The computer's own voice is only a fallback for a missing file.

The fallback voice is the computer's own Hebrew voice:
- **Mac, iPad, iPhone:** works in any browser (the "Carmit" voice).
- **Windows:** use **Microsoft Edge**. It has very natural Hebrew voices. Chrome on Windows only speaks Hebrew if the Hebrew language pack is installed in Windows.

If there's no Hebrew voice, the text still appears.

**Your own voice (or any voice you like):** `assets/voice/LINES.md` lists every sentence with its file name. Record them (or generate them with any text-to-speech site) and save them into `assets/voice/` with those names, replacing the Gemini files. The sentences themselves are in `VOICE_LINES` in `game.js` if you want to change the wording; after changing one, remake its file with `GEMINI_API_KEY=... python3 tools/make_voices.py <id>` and check it with `tools/check_voices.py`, or just run the "Make voice files" GitHub Action, which remakes and checks all of them.

The five activities each end with a big smiling star and Michael cheering, then the menu comes back. **Free play** (the last card) has everything switched on and never ends, and it's the only mode where he can go into the house.

| Card | Done when |
| --- | --- |
| Sky Color Hunt | all 5 sky buttons are found and the dragon parade has passed |
| Hide and Seek | all hiding dinos are found |
| Feed the Dragons | the dragons have had 3 happy meals (`FEEDS_TO_FINISH`) |
| Grumpy Dragon | he's been given his food and turned happy |
| Airplane Ride | the plane has landed |

A yellow arrow points the way when it helps: at the airplane in the airplane activity, and at the dragon once Michael is carrying the food it wants.

## What's in the world

| Activity | How it works |
| --- | --- |
| Sky Color Hunt | 5 colored buttons peek out of little snow mounds (they twinkle now and then). Stepping on one changes the sky: brown, blue, yellow, green, or orange. Finding all 5 starts a dragon parade under a rainbow sky. The buttons then hide again somewhere new. The circles at the top-left fill in as he finds them. |
| Hide and Seek | Dinosaurs hide behind the red trees. Only a wiggly tail shows, and sometimes a head peeks out. Walking up to the tree makes the dino pop out with a cheer, and a star at the top lights up. Found dinos follow Michael around. When all are found there's a party, then they run off to hide again. |
| Feed the Dragons | Two baby dragons on the picnic blanket show a picture of the food they want. Michael picks up food (it stacks on his head) and walks over. The badge at the top-right shows the time of day and the menu: pancakes (morning), grilled cheese (noon), pasta and pizza (night). |
| Grumpy Dragon | A grey dragon in the bottom-right corner stomps and puffs smoke. He never hurts Michael, he just goes "hmph". Bring him the food in his bubble and he turns into a happy pink dragon. In free play he gets grumpy again after 2 minutes so it can be played again. |
| Airplane Ride | Walk to the yellow airplane on the runway. Michael hops in and flies over the whole town, then lands. |
| House and TV | Walk into the door of the purple house. Walk up to the TV to change the channel, and walk down onto the doormat (green arrow) to go back outside. |

Also: touch a rocket for a wobble and a "boing", touch a dragon or dino for hearts, and touch a townsperson and they wave.

## Changing things

Everything you'd want to tweak is in the `CONFIG` block at the top of `game.js`: Michael's height, walking speed, how many dragons, dinos, people and foods there are, the time of day (`'cycle'`, `'clock'`, or a fixed `'morning'`/`'noon'`/`'night'`), how many meals finish the feeding game, sound volume, background music volume (`MUSIC_VOLUME`, 0 turns it off), and all the world colors.

## Michael's picture

The game uses `assets/michael.png` and cuts out the white background by flood-filling from the edges of the picture. That keeps his white shoes intact.

When `index.html` is opened straight from disk, browsers won't let the game read the picture's pixels. So the same picture is also stored as text in `assets/michael-data.js`. **If you replace `michael.png`, rebuild that file** by running this from this folder:

```
python3 -c "import base64;open('assets/michael-data.js','w').write('window.MICHAEL_IMAGE_DATA=\"data:image/png;base64,'+base64.b64encode(open('assets/michael.png','rb').read()).decode()+'\";\n')"
```

If neither file is there, a simple drawn boy is used instead.
