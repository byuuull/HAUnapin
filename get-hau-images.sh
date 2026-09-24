#!/bin/sh
# Downloads Holy Angel University's campus map and history photos from hau.edu.ph
# into images/hau/ so the site shows them even offline.  Usage: sh get-hau-images.sh
cd "$(dirname "$0")" || exit 1
mkdir -p images/hau
for url in \
  https://www.hau.edu.ph/upload/history/HAA_1933_pioneerstudents.png \
  https://www.hau.edu.ph/upload/history/HAC_MGN.png \
  https://www.hau.edu.ph/images/haucampusmap_2022.jpg \
  https://www.hau.edu.ph/upload/history/SFJ_2008.png \
  https://www.hau.edu.ph/upload/history/MGN_2004.png \
  https://www.hau.edu.ph/upload/history/PGN_2014.png \
  https://www.hau.edu.ph/upload/history/epiphanyofangels_2013.png
do
  name=$(basename "$url")
  if curl -fsSL "$url" -o "images/hau/$name"; then echo "Saved $name"; else echo "Couldn't download $name"; fi
done
echo "Done. Images are in images/hau"
