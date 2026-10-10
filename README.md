# Airplane's Land

A gentle exploring game for Michael. No losing, no timers, no score, no reading.

## Play

Double-click `index.html`. Michael walks with the **arrow keys**.
Grown-ups: **M** mutes and unmutes the sound.

## What's in the world

| Activity | How it works |
| --- | --- |
| Sky Color Hunt | 5 colored buttons peek out of little snow mounds (they twinkle now and then). Stepping on one changes the sky: brown, blue, yellow, green, or orange. Finding all 5 starts a dragon parade under a rainbow sky. The buttons then hide again somewhere new. The circles at the top-left fill in as he finds them. |
| Hide and Seek | Dinosaurs hide behind the red trees. Only a wiggly tail shows, and sometimes a head peeks out. Walking up to the tree makes the dino pop out with a cheer, and a star at the top lights up. Found dinos follow Michael around. When all are found there's a party, then they run off to hide again. |
| Feed the Dragons | Two baby dragons on the picnic blanket show a picture of the food they want. Michael picks up food (it stacks on his head) and walks over. The badge at the top-right shows the time of day and the menu: pancakes (morning), grilled cheese (noon), pasta and pizza (night). |
| Grumpy Dragon | A grey dragon in the bottom-right corner stomps and puffs smoke. He never hurts Michael, he just goes "hmph". Bring him the food in his bubble and he turns into a happy pink dragon. After 2 minutes he gets grumpy again so it can be played again. |
| Airplane Ride | Walk to the yellow airplane on the runway. Michael hops in and flies over the whole town, then lands. |
| House and TV | Walk into the door of the purple house. Walk up to the TV to change the channel, and walk down onto the doormat (green arrow) to go back outside. |

Also: touch a rocket for a wobble and a "boing", touch a dragon or dino for hearts, and touch a townsperson and they wave.

## Changing things

Everything you'd want to tweak is in the `CONFIG` block at the top of `game.js`: Michael's height, walking speed, how many dragons, dinos, people and foods there are, the time of day (`'cycle'`, `'clock'`, or a fixed `'morning'`/`'noon'`/`'night'`), sound volume, and all the world colors.

## Michael's picture

The game uses `assets/michael.png` and cuts out the white background by flood-filling from the edges of the picture. That keeps his white shoes intact.

When `index.html` is opened straight from disk, browsers won't let the game read the picture's pixels. So the same picture is also stored as text in `assets/michael-data.js`. **If you replace `michael.png`, rebuild that file** by running this from this folder:

```
python3 -c "import base64;open('assets/michael-data.js','w').write('window.MICHAEL_IMAGE_DATA=\"data:image/png;base64,'+base64.b64encode(open('assets/michael.png','rb').read()).decode()+'\";\n')"
```

If neither file is there, a simple drawn boy is used instead.
