/* ============================================================
   Static data: campus buildings, categories and sample reports.
   Map units: an SVG viewBox of 1830 × 1340, drawn from the team's
   campus map (HAU's 21 numbered buildings). Positions are schematic,
   not survey-accurate.
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  /* The 21 buildings of the team's campus map (numbered like HAU's official map).
     path = roof outline in map units; ax, ay = label anchor (also where new pins land);
     box = bounding box used for hit-testing and building counts; tone = roof colour. */
  const BUILDINGS = [
    {"num": 1, "id": "red", "code": "Red", "name": "Plaza De Corazon Building (Red Bldg.)", "offices": ["Human Resource Development Office", "Dormitory"], "path": "M84.0 400.0H126.0Q150.0 400.0 150.0 424.0V509.0Q150.0 533.0 126.0 533.0H84.0Q60.0 533.0 60.0 509.0V424.0Q60.0 400.0 84.0 400.0Z", "ax": 105, "ay": 466, "box": {"x": 60.0, "y": 400.0, "w": 90.0, "h": 133.0}, "tone": "red"},
    {"num": 2, "id": "smt", "code": "SMT", "name": "St. Martha Hall", "offices": ["Admissions Office & Testing Center", "Dormitory"], "path": "M175.0 402.0H218.0Q238.0 402.0 238.0 422.0V605.0Q238.0 625.0 218.0 625.0H175.0Q155.0 625.0 155.0 605.0V422.0Q155.0 402.0 175.0 402.0Z", "ax": 196, "ay": 507, "box": {"x": 155.0, "y": 402.0, "w": 83.0, "h": 223.0}},
    {"num": 3, "id": "sfj", "code": "SFJ", "name": "San Francisco De Javier Building", "offices": ["President's Office", "University Library", "University Theater"], "path": "M310.0 402.0H452.0Q472.0 402.0 472.0 422.0V638.0Q472.0 658.0 452.0 658.0H310.0Q290.0 658.0 290.0 638.0V422.0Q290.0 402.0 310.0 402.0Z", "ax": 381, "ay": 525, "box": {"x": 290.0, "y": 402.0, "w": 182.0, "h": 256.0}, "tone": "sfj"},
    {"num": 4, "id": "stl", "code": "STL", "name": "St. Therese of Lisieux Building", "offices": ["School of Hospitality & Tourism Management Dean's Office"], "path": "M605.0 395.0H868.0Q890.0 395.0 890.0 417.0V458.0Q890.0 480.0 868.0 480.0H670.0V565.0H740.0Q762.0 565.0 762.0 587.0V630.0Q762.0 652.0 740.0 652.0H605.0Q583.0 652.0 583.0 630.0V417.0Q583.0 395.0 605.0 395.0Z", "ax": 627, "ay": 524, "box": {"x": 583.0, "y": 395.0, "w": 307.0, "h": 257.0}},
    {"num": 5, "id": "whc", "code": "WH", "name": "Warehouse & Carpentry", "offices": ["Maintenance"], "path": "M367.0 126.0H410.0Q432.0 126.0 432.0 148.0V162.0Q432.0 184.0 412.0 184.0V360.0Q412.0 382.0 390.0 382.0H368.0Q346.0 382.0 346.0 360.0V148.0Q346.0 126.0 367.0 126.0Z", "ax": 379, "ay": 280, "box": {"x": 346.0, "y": 126.0, "w": 86.0, "h": 256.0}},
    {"num": 6, "id": "yfc", "code": "Food Court", "name": "Yellow Food Court", "offices": ["Food stalls", "Dining area"], "path": "M477.0 126.0H518.0Q540.0 126.0 540.0 148.0V360.0Q540.0 382.0 518.0 382.0H477.0Q455.0 382.0 455.0 360.0V148.0Q455.0 126.0 477.0 126.0Z", "ax": 497, "ay": 254, "box": {"x": 455.0, "y": 126.0, "w": 85.0, "h": 256.0}, "tone": "yellow"},
    {"num": 7, "id": "sgh", "code": "SGH", "name": "St. Gabriel Hall", "offices": ["Classrooms"], "path": "M600.0 126.0H621.0Q643.0 126.0 643.0 148.0V320.0H578.0V148.0Q578.0 126.0 600.0 126.0Z", "ax": 610, "ay": 230, "box": {"x": 578.0, "y": 126.0, "w": 65.0, "h": 194.0}, "tone": "u"},
    {"num": 8, "id": "srh", "code": "SRH", "name": "St. Raphael Hall", "offices": ["Classrooms"], "path": "M578.0 320.0H802.0V360.0Q802.0 382.0 780.0 382.0H600.0Q578.0 382.0 578.0 360.0Z", "ax": 690, "ay": 351, "box": {"x": 578.0, "y": 320.0, "w": 224.0, "h": 62.0}, "tone": "u"},
    {"num": 9, "id": "smh", "code": "SMH", "name": "St. Michael Hall", "offices": ["Classrooms"], "path": "M760.0 126.0H780.0Q802.0 126.0 802.0 148.0V320.0H738.0V148.0Q738.0 126.0 760.0 126.0Z", "ax": 770, "ay": 230, "box": {"x": 738.0, "y": 126.0, "w": 64.0, "h": 194.0}, "tone": "u"},
    {"num": 10, "id": "ggn", "code": "GGN", "name": "Geromin G. Nepomuceno Building", "offices": ["Principal's Office / Faculty Room", "High School Library"], "path": "M1064.0 46.0H1148.0Q1172.0 46.0 1172.0 70.0V352.0Q1172.0 376.0 1148.0 376.0H920.0Q896.0 376.0 896.0 352.0V322.0Q896.0 298.0 920.0 298.0H1040.0V128.0H922.0Q898.0 128.0 898.0 104.0V72.0Q898.0 48.0 922.0 48.0H1040.0Q1040.0 46.0 1064.0 46.0Z", "ax": 1105, "ay": 208, "box": {"x": 896.0, "y": 46.0, "w": 276.0, "h": 330.0}, "tone": "brick"},
    {"num": 11, "id": "pgn", "code": "PGN", "name": "Peter G. Nepomuceno Building", "offices": ["OSSA – Scholarship & Grants Office", "School of Business & Accountancy Dean's Office", "PGN Auditorium", "Graduate School"], "path": "M964.0 400.0H1076.0Q1100.0 400.0 1100.0 424.0V628.0Q1100.0 652.0 1076.0 652.0H797.0Q773.0 652.0 773.0 628.0V552.0Q773.0 528.0 797.0 528.0H940.0V424.0Q940.0 400.0 964.0 400.0Z", "ax": 1020, "ay": 540, "box": {"x": 773.0, "y": 400.0, "w": 327.0, "h": 252.0}, "tone": "navy"},
    {"num": 12, "id": "djdn", "code": "DJDN", "name": "Don Juan D. Nepomuceno Building (Main Bldg.)", "offices": ["Registrar's Office", "Finance Office", "CKS Office"], "path": "M609.0 912.0H899.0Q925.0 912.0 925.0 938.0V1259.0Q925.0 1285.0 899.0 1285.0H609.0Q583.0 1285.0 583.0 1259.0V938.0Q583.0 912.0 609.0 912.0Z", "ax": 754, "ay": 1100, "box": {"x": 583.0, "y": 912.0, "w": 342.0, "h": 373.0}, "tone": "cream"},
    {"num": 13, "id": "aps", "code": "APS", "name": "Archbishop Pedro Santos Building", "offices": ["Classrooms"], "path": "M1138.0 400.0H1398.0Q1422.0 400.0 1422.0 424.0V581.0Q1422.0 605.0 1398.0 605.0H1302.0Q1278.0 605.0 1278.0 581.0V503.0H1138.0Q1115.0 503.0 1115.0 480.0V423.0Q1115.0 400.0 1138.0 400.0Z", "ax": 1260, "ay": 452, "box": {"x": 1115.0, "y": 400.0, "w": 307.0, "h": 205.0}},
    {"num": 14, "id": "mgn", "code": "MGN", "name": "Mamerto G. Nepomuceno Building", "offices": ["School of Nursing & Applied Medical Sciences Dean's Office", "College of Criminal Justice Education & Forensics Dean's Office"], "path": "M964.0 912.0H1076.0Q1100.0 912.0 1100.0 936.0V1261.0Q1100.0 1285.0 1076.0 1285.0H964.0Q940.0 1285.0 940.0 1261.0V936.0Q940.0 912.0 964.0 912.0Z", "ax": 1020, "ay": 1098, "box": {"x": 940.0, "y": 912.0, "w": 160.0, "h": 373.0}},
    {"num": 15, "id": "chp", "code": "Chapel", "name": "Chapel of the Holy Guardian Angel", "offices": ["Chapel"], "path": "M1335.0 655.0V845.0H1315.0A95 95 0 0 1 1315.0 655.0Z", "ax": 1278, "ay": 745, "box": {"x": 1220, "y": 655.0, "w": 115.0, "h": 190.0}, "tone": "chapel"},
    {"num": 16, "id": "sjn", "code": "SJN", "name": "Sister Josefina Nepomuceno Formation Center", "offices": ["Formation Center"], "path": "M1352.0 637.0H1416.0Q1438.0 637.0 1438.0 659.0V856.0Q1438.0 878.0 1416.0 878.0H1352.0Q1330.0 878.0 1330.0 856.0V659.0Q1330.0 637.0 1352.0 637.0Z", "ax": 1384, "ay": 750, "box": {"x": 1330.0, "y": 637.0, "w": 108.0, "h": 241.0}},
    {"num": 17, "id": "sjh", "code": "SJH", "name": "St. Joseph Hall", "offices": ["School of Education Dean's Office", "School of Arts & Sciences Dean's Office", "School of Computing Dean's Office", "Academic Hall", "Security Office (ground floor)"], "path": "M1139.0 1140.0H1421.0Q1445.0 1140.0 1445.0 1164.0V1251.0Q1445.0 1275.0 1421.0 1275.0H1139.0Q1115.0 1275.0 1115.0 1251.0V1164.0Q1115.0 1140.0 1139.0 1140.0Z", "ax": 1280, "ay": 1207, "box": {"x": 1115.0, "y": 1140.0, "w": 330.0, "h": 135.0}},
    {"num": 18, "id": "sh", "code": "SH", "name": "Sacred Heart Building", "offices": ["School of Engineering & Architecture Dean's Office", "Engineering laboratories"], "path": "M1466.0 402.0H1756.0Q1780.0 402.0 1780.0 426.0V651.0Q1780.0 675.0 1756.0 675.0H1664.0Q1640.0 675.0 1640.0 651.0V605.0H1469.0Q1445.0 605.0 1445.0 581.0V530.0Q1445.0 506.0 1469.0 506.0H1500.0V478.0H1466.0Q1442.0 478.0 1442.0 454.0V426.0Q1442.0 402.0 1466.0 402.0Z", "ax": 1710, "ay": 540, "box": {"x": 1442.0, "y": 402.0, "w": 338.0, "h": 273.0}},
    {"num": 19, "id": "cct", "code": "Court", "name": "Covered Court", "offices": ["Covered court"], "path": "M1466.0 632.0H1586.0Q1610.0 632.0 1610.0 656.0V697.0H1756.0Q1780.0 697.0 1780.0 721.0V856.0Q1780.0 880.0 1756.0 880.0H1466.0Q1442.0 880.0 1442.0 856.0V656.0Q1442.0 632.0 1466.0 632.0Z", "ax": 1600, "ay": 775, "box": {"x": 1442.0, "y": 632.0, "w": 338.0, "h": 248.0}, "tone": "court"},
    {"num": 20, "id": "ihg", "code": "IHG", "name": "Immaculate Heart Gymnasium", "offices": ["Gymnasium"], "path": "M1504.0 912.0H1756.0Q1780.0 912.0 1780.0 936.0V1158.0Q1780.0 1182.0 1756.0 1182.0H1504.0Q1480.0 1182.0 1480.0 1158.0V936.0Q1480.0 912.0 1504.0 912.0Z", "ax": 1630, "ay": 1040, "box": {"x": 1480.0, "y": 912.0, "w": 300.0, "h": 270.0}},
    {"num": 21, "id": "iga", "code": "IHGA", "name": "Immaculate Heart Gymnasium Annex", "offices": ["Gymnasium annex"], "path": "M1506.0 1210.0H1754.0Q1780.0 1210.0 1780.0 1236.0V1254.0Q1780.0 1280.0 1754.0 1280.0H1506.0Q1480.0 1280.0 1480.0 1254.0V1236.0Q1480.0 1210.0 1506.0 1210.0Z", "ax": 1630, "ay": 1245, "box": {"x": 1480.0, "y": 1210.0, "w": 300.0, "h": 70.0}, "tone": "gray"},
  ];

  /* Old building ids from earlier map versions, mapped to the building that now covers them */
  const ALIASES = { sc: 'ggn', sca: 'ggn', les: 'ggn', scb: 'smh', mab: 'sh' };

  /* Campus grounds: lawns, drive lanes, roundabout, covered walkways, fence, gates and trees */
  const CAMPUS = {"width": 1830, "height": 1350, "boundary": "M76.0 30.0H1774.0Q1800.0 30.0 1800.0 56.0V1240.0Q1800.0 1266.0 1774.0 1266.0H76.0Q50.0 1266.0 50.0 1240.0V56.0Q50.0 30.0 76.0 30.0Z", "bbox": {"x0": 0, "y0": 10, "x1": 1840, "y1": 1340}, "lawns": ["M1140.0 920.0H1444.0Q1462.0 920.0 1462.0 938.0V1102.0Q1462.0 1120.0 1444.0 1120.0H1140.0Q1122.0 1120.0 1122.0 1102.0V938.0Q1122.0 920.0 1140.0 920.0Z", "M1218.0 70.0H1742.0Q1760.0 70.0 1760.0 88.0V352.0Q1760.0 370.0 1742.0 370.0H1218.0Q1200.0 370.0 1200.0 352.0V88.0Q1200.0 70.0 1218.0 70.0Z", "M76.0 1045.0H254.0Q270.0 1045.0 270.0 1061.0V1249.0Q270.0 1265.0 254.0 1265.0H76.0Q60.0 1265.0 60.0 1249.0V1061.0Q60.0 1045.0 76.0 1045.0Z", "M351.0 910.0H549.0Q565.0 910.0 565.0 926.0V1234.0Q565.0 1250.0 549.0 1250.0H351.0Q335.0 1250.0 335.0 1234.0V926.0Q335.0 910.0 351.0 910.0Z", "M93.0 70.0H307.0Q325.0 70.0 325.0 88.0V352.0Q325.0 370.0 307.0 370.0H93.0Q75.0 370.0 75.0 352.0V88.0Q75.0 70.0 93.0 70.0Z"], "roads": ["M260.0 280.0V600.0Q260.0 665.0 330.0 668.0", "M305.0 1302.0V940.0Q305.0 878.0 360.0 874.0", "M490.0 788.0H1200.0"], "roundabout": {"cx": 382, "cy": 773}, "canopies": [[575, 672, 545, 86], [575, 822, 545, 86], [85, 702, 180, 84], [85, 955, 180, 84]], "fences": ["M80.0 725.0V1025.0", "M165.0 1282.0H465.0"], "posts": [[81, 721], [81, 1027], [163, 1283], [467, 1283]], "gates": [{"label": "Main Gate", "x": 48, "y": 875, "dir": "left"}, {"label": "Gate 1", "x": 315, "y": 1322, "dir": "down"}], "trees": [[1170, 970], [1240, 1040], [1320, 965], [1400, 1060], [1410, 960], [1165, 1090], [105, 1085], [180, 1140], [120, 1210], [230, 1080], [380, 960], [490, 1000], [410, 1090], [520, 1140], [390, 1210], [140, 120], [220, 210], [150, 300], [270, 150], [1260, 130], [1360, 210], [1480, 130], [1620, 190], [1710, 300], [1540, 300], [1300, 310], [850, 160], [860, 250], [530, 710], [530, 870], [1160, 730], [1160, 850]], "landmarks": [{"label": "Garden", "x": 1480, "y": 225}, {"label": "Rotunda", "x": 382, "y": 652}], "outlines": ["M600 126H621Q643 126 643 148V306Q643 320 657 320H724Q738 320 738 306V148Q738 126 760 126H780Q802 126 802 148V360Q802 382 780 382H600Q578 382 578 360V148Q578 126 600 126Z"]};

  const CATEGORIES = [
    { id: 'electronics', label: 'Electronics', icon: 'cat-electronics' },
    { id: 'ids', label: 'IDs & Cards', icon: 'cat-ids' },
    { id: 'wallets', label: 'Wallets', icon: 'cat-wallets' },
    { id: 'bags', label: 'Bags', icon: 'cat-bags' },
    { id: 'keys', label: 'Keys', icon: 'cat-keys' },
    { id: 'clothing', label: 'Clothing', icon: 'cat-clothing' },
    { id: 'books', label: 'Books & School Supplies', icon: 'cat-books', short: 'Books' },
    { id: 'accessories', label: 'Bottles & Accessories', icon: 'cat-accessories', short: 'Accessories' },
    { id: 'others', label: 'Others', icon: 'cat-others' },
  ];

  /* Sample reports. `hoursAgo` is turned into a real timestamp the first time the
     site loads, so the demo always looks current. Names are fictional. */
  const SEED = [
    { title: 'Silver Insulated Bottle', cat: 'accessories', status: 'found', bldg: 'sfj', spot: 'University Library, 2nd Floor', hoursAgo: 2, desc: 'Silver stainless-steel bottle with a small HAU sticker near the cap. Turned in at the library counter.', by: 'Kim R.' , photo: 'images/items/steel-bottle.jpg', owner: 'maria.santos@hau.edu.ph', state: 'returned' },
    { title: 'Student ID (School of Computing)', cat: 'ids', status: 'found', bldg: 'pgn', spot: 'Room 104, near the stairs', hoursAgo: 5, desc: 'HAU student ID on a maroon School of Computing lanyard. The name is hidden here for privacy, so be ready to confirm it.', by: 'Paolo M.' , photo: 'images/items/student-id.jpg' },
    { title: 'Black Leather Wallet', cat: 'wallets', status: 'lost', bldg: 'sfj', spot: 'Library, 2nd floor study tables', hoursAgo: 9, desc: 'Black bi-fold leather wallet with worn edges and a small scratch on the front. Has my student ID and a few cards inside.', by: 'Mark Andrew S.' , photo: 'images/items/black-wallet-2.jpg', gallery: ['images/items/leather-texture.jpg', 'images/items/wallet-open.jpg', 'images/items/wallet-cards.jpg', 'images/items/wallet-studio.jpg'], avatar: 'images/people/reporter-mark.jpg' },
    { title: 'Black AirPods Pro Case', cat: 'electronics', status: 'lost', bldg: 'chp', spot: 'Near the side entrance', hoursAgo: 20, desc: 'AirPods Pro charging case in a plain black silicone cover. Lost after the 10 AM mass.', by: 'Bea L.' , photo: 'images/items/earbuds.jpg', avatar: 'images/people/user-2.jpg' },
    { title: 'Blue Hydro Flask (32 oz)', cat: 'accessories', status: 'found', bldg: 'ggn', spot: '3rd floor study area', hoursAgo: 26, desc: 'Navy blue 32 oz Hydro Flask with a few stickers on the side.', by: 'Jerome V.' , photo: 'images/items/hydro-flask.jpg', avatar: 'images/people/story-jerome.jpg' },
    { title: 'Navy Blue Backpack', cat: 'bags', status: 'found', bldg: 'yfc', spot: 'Corner table near the drinks stall', hoursAgo: 30, desc: 'Navy backpack with notebooks inside. Left under a table at lunch.', by: 'Andrea C.' , photo: 'images/items/backpack.jpg' },
    { title: 'Toyota Car Key', cat: 'keys', status: 'lost', bldg: 'sjh', spot: 'Driveway beside St. Joseph Hall', hoursAgo: 44, desc: 'Toyota smart key with a leather HAU keychain. Possibly dropped between the east gate and the SJH entrance.', by: 'Ramon D.' , photo: 'images/items/car-keys.jpg', avatar: 'images/people/user-3.jpg' },
    { title: 'Clear Frame Eyeglasses', cat: 'accessories', status: 'found', bldg: 'djdn', spot: "Registrar's Office queue area", hoursAgo: 52, desc: 'Prescription glasses with clear frames in a brown case.', by: 'Liza P.' , photo: 'images/items/eyeglasses.jpg' },
    { title: 'Scientific Calculator (Casio fx-991EX)', cat: 'electronics', status: 'lost', bldg: 'sh', spot: 'Room 305', hoursAgo: 70, desc: 'Grey Casio fx-991EX with my initials scratched on the back cover.', by: 'Nico T.' },
    { title: 'PE Uniform Shirt', cat: 'clothing', status: 'found', bldg: 'ihg', spot: 'Bleachers, left side', hoursAgo: 90, desc: 'White HAU PE shirt, size medium, folded on the bleachers after class.', by: 'Coach R.' },
    { title: 'Engineering Drawing Kit', cat: 'books', status: 'lost', bldg: 'sh', spot: 'Drafting room, 4th floor', hoursAgo: 110, desc: 'Grey hard case with a T-square, triangles and technical pens. Name label inside the lid.', by: 'Elena R.' , avatar: 'images/people/story-elena.jpg' },
    { title: 'Maroon Folding Umbrella', cat: 'others', status: 'found', bldg: 'mgn', spot: 'Lobby umbrella rack', hoursAgo: 130, desc: 'Maroon foldable umbrella with a wooden handle, left in the lobby rack for three days.', by: 'Guard on duty' },
    { title: 'Samsung Phone, Black Case', cat: 'electronics', status: 'found', bldg: 'cct', spot: 'Near the stage', hoursAgo: 150, desc: 'Samsung phone in a matte black case. Locked, so the owner will need to unlock it to claim.', by: 'Joanna S.', state: 'claim-requested' },
    { title: 'Accountancy Reviewer Book', cat: 'books', status: 'lost', bldg: 'pgn', spot: 'SBA faculty area, 5th floor', hoursAgo: 170, desc: 'Thick reviewer with yellow tabs and handwritten notes on the margins.', by: 'Carla G.' },
    { title: 'Room Keys on HAU Lanyard', cat: 'keys', status: 'found', bldg: 'stl', spot: 'SHTM kitchen lab entrance', hoursAgo: 200, desc: 'Two silver keys on a maroon HAU lanyard.', by: 'Chef Anton' },
    { title: 'Brown Leather Wallet', cat: 'wallets', status: 'lost', bldg: 'aps', spot: 'Ground floor benches', hoursAgo: 230, desc: 'Brown leather card wallet. Returned through the Security Office.', by: 'Miguel F.', state: 'returned' , photo: 'images/items/brown-wallet.jpg' },
    { title: 'Denim Jacket', cat: 'clothing', status: 'lost', bldg: 'yfc', spot: 'Back seats', hoursAgo: 260, desc: 'Light-wash denim jacket with a small enamel pin on the collar.', by: 'Trish N.' },
    { title: 'USB-C Laptop Charger (65 W)', cat: 'electronics', status: 'found', bldg: 'sjh', spot: 'Academic Hall, 3rd floor', hoursAgo: 300, desc: 'White 65 W USB-C charger with a short cable.', by: 'Dan Y.', state: 'returned' },
    { title: 'Pink Floral Tumbler', cat: 'accessories', status: 'lost', bldg: 'smt', spot: 'Admissions waiting area', hoursAgo: 340, desc: 'Pink tumbler with a floral print and a straw lid.', by: 'Hannah B.' },
    { title: 'Blue Thesis Binder', cat: 'books', status: 'found', bldg: 'ggn', spot: 'Ground floor corridor', hoursAgo: 400, desc: 'Blue ring binder with printed thesis chapters and sketches.', by: 'Security Office', state: 'returned' , photo: 'images/items/binder.jpg' },
    { title: 'Brown Leather Card Wallet', cat: 'wallets', status: 'lost', bldg: 'chp', spot: 'Near Gate 1, by the chapel steps', hoursAgo: 46, desc: 'Slim brown leather wallet with cream stitching. Has my Angelite card and a jeepney fare card.', by: 'Maria Santos', owner: 'maria.santos@hau.edu.ph', photo: 'images/items/brown-wallet-desk.jpg', avatar: 'images/people/mascot.jpg' },
    { title: 'Black Bi-fold Wallet', cat: 'wallets', status: 'lost', bldg: 'ggn', spot: 'Room 204', hoursAgo: 4, desc: 'Black pebbled-leather bi-fold, no cash inside, a few receipts and a library card.', by: 'Maria Santos', owner: 'maria.santos@hau.edu.ph', photo: 'images/items/black-wallet.jpg', avatar: 'images/people/mascot.jpg' },
    { title: 'Black Coin Purse', cat: 'wallets', status: 'found', bldg: 'yfc', spot: 'Main cafeteria, cashier counter', hoursAgo: 60, desc: 'Small black zip coin purse with a gold-coloured coin charm. Turned in by the cashier.', by: 'Cafeteria staff', photo: 'images/items/coin-purse.jpg' },
    { title: 'Black Wallet with Snap Button', cat: 'wallets', status: 'found', bldg: 'sjn', spot: 'Ground floor lobby bench', hoursAgo: 75, desc: 'Black leather wallet with a round metal snap. Turned in at the Security Office.', by: 'Paolo M.', photo: 'images/items/black-wallet-wood.jpg' },
    { title: 'Silver Analogue Wristwatch', cat: 'accessories', status: 'lost', bldg: 'ihg', spot: 'Changing area after PE', hoursAgo: 420, desc: 'Silver chronograph with a black leather strap. It belonged to my grandfather.', by: 'Maria C.', photo: 'images/items/watch.jpg', state: 'returned', avatar: 'images/people/story-maria.jpg' },
    { title: 'Over-ear Headphones', cat: 'electronics', status: 'lost', bldg: 'aps', spot: '2nd floor study area', hoursAgo: 460, desc: 'Black over-ear headphones with a scratch on the left cup.', by: 'Elena R.', photo: 'images/items/headphones.jpg', state: 'returned', avatar: 'images/people/story-elena.jpg' },
  ];


  /* Where hand-overs happen and how to reach people. The office location and hours
     follow the team's mockup; the trunkline and local come from hau.edu.ph/contacts. */
  const CONTACT = {
    securityOffice: 'Security Office, ground floor of St. Joseph Hall (SJH)',
    securityShort: 'Security Office, SJH ground floor',
    securityBldg: 'sjh',
    hours: 'Mon–Sat, 7:00 AM – 9:00 PM',
    trunkline: '(045) 625-5748',
    campusServicesLocal: '1177',
    holdDays: 90,
  };

  /* Facts about the university, from hau.edu.ph and its History page */
  const HAU = {
    name: 'Holy Angel University',
    address: '#1 Holy Angel Avenue, Sto. Rosario, Angeles City, Pampanga 2009',
    founded: 'June 1933',
    founders: 'Don Juan D. Nepomuceno and Fr. Pedro P. Santos',
    motto: 'Laus Deo Semper (Praise God Always)',
    site: 'https://www.hau.edu.ph/',
    // Official images: run get-hau-images to save local copies into images/hau/
    images: {
      pioneers: { local: 'images/hau/HAA_1933_pioneerstudents.png', remote: 'https://www.hau.edu.ph/upload/history/HAA_1933_pioneerstudents.png' },
      firstPresident: { local: 'images/hau/HAC_MGN.png', remote: 'https://www.hau.edu.ph/upload/history/HAC_MGN.png' },
      campusMap: { local: 'images/hau/haucampusmap_2022.jpg', remote: 'https://www.hau.edu.ph/images/haucampusmap_2022.jpg' },
      sfj: { local: 'images/hau/SFJ_2008.png', remote: 'https://www.hau.edu.ph/upload/history/SFJ_2008.png' },
      mgn: { local: 'images/hau/MGN_2004.png', remote: 'https://www.hau.edu.ph/upload/history/MGN_2004.png' },
      pgn: { local: 'images/hau/PGN_2014.png', remote: 'https://www.hau.edu.ph/upload/history/PGN_2014.png' },
      epiphany: { local: 'images/hau/epiphanyofangels_2013.png', remote: 'https://www.hau.edu.ph/upload/history/epiphanyofangels_2013.png' },
    },
    milestones: [
      { year: '1933', text: 'Holy Angel Academy opens in Angeles with 78 high school students, founded by Don Juan D. Nepomuceno and Fr. Pedro P. Santos.', img: 'pioneers', alt: 'Holy Angel Academy’s pioneer students, 1933' },
      { year: '1981', text: 'Gains university status on 4 December 1981. Engr. Mamerto G. Nepomuceno becomes the first University President in 1982.', img: 'firstPresident', alt: 'Engr. Mamerto G. Nepomuceno, first University President' },
      { year: '2004', text: 'Mamerto G. Nepomuceno Building opens.', img: 'mgn', alt: 'Mamerto G. Nepomuceno Building' },
      { year: '2008', text: 'San Francisco de Javier Building opens: library, theatre and the President’s office.', img: 'sfj', alt: 'San Francisco de Javier Building' },
      { year: '2013', text: 'Epiphany of Angels park is unveiled.', img: 'epiphany', alt: 'Epiphany of Angels park' },
      { year: '2014', text: 'Peter G. Nepomuceno Center for Professional Development opens.', img: 'pgn', alt: 'Peter G. Nepomuceno Center' },
    ],
  };

  const TEAM = [
    { name: 'Kimberly C. Jimenez', photo: 'images/people/kimberly-jimenez.jpg' },
    { name: 'Bethea P. Samson', photo: 'images/people/bethea-samson.jpg' },
    { name: 'Dominique Y. Tabinas', photo: 'images/people/dominique-tabinas.jpg' },
  ];

  /* Success stories (sample) */
  const STORIES = [
    { title: 'The Heirloom Watch', photo: 'images/items/watch.jpg', text: 'Lost during a PE class at the gym. A freshman found it and it was back with its owner within two hours.', quote: 'I thought it was gone forever. This watch belonged to my grandfather. God bless the person who found it!', by: 'Maria C.', role: 'SEA student', avatar: 'images/people/story-maria.jpg' },
    { title: 'Thesis Architecture Kit', photo: 'images/items/binder.jpg', text: 'Left in the SJN cafeteria during a late-night study session. A security guard kept it safe until the owner reported it.', quote: 'All my semester’s work was in that binder. HAUnapin saved my degree! So grateful.', by: 'Jerome V.', role: 'SHTM student', avatar: 'images/people/story-jerome.jpg' },
    { title: 'The Study Buddy', photo: 'images/items/headphones.jpg', text: 'Found at the APS study area. The finder logged it here and the owner spotted the report the same afternoon.', quote: 'I saw the report before I even realised I’d left them. The system works!', by: 'Elena R.', role: 'SOC student', avatar: 'images/people/story-elena.jpg' },
    { title: 'Back Before Class', photo: 'images/items/hydro-flask.jpg', text: 'A Hydro Flask left in the GGN study area was turned in and claimed before the next period.', quote: 'Didn’t expect to see it again, let alone that fast.', by: 'Paolo M.', role: 'SBA student', avatar: 'images/people/user-2.jpg' },
  ];

  const FAQ = [
    { q: 'How long are found items kept?', a: 'Found items are held by the University Security Office for 90 days. After that, unclaimed items may be donated to HAU’s partner charities.' },
    { q: 'Is there a fee for using this platform?', a: 'No. HAUnapin Natin ’Yan! is free for the Angelite community.' },
    { q: 'How do I prove an item belongs to me?', a: 'Describe something that isn’t in the public listing, like what’s inside a bag or wallet, unlock a phone or laptop, or show a matching ID.' },
    { q: 'Where do I hand over or collect an item?', a: 'At the University Security Office, during office hours. Never arrange a private meet-up.' },
    { q: 'Can I edit or remove my report?', a: 'Yes. Log in and open My Profile. You can mark an item as returned or delete the report.' },
  ];

  /* Help Centre articles. `topic` groups them into the four cards. */
  const HELP = [
    { id: 'create-account', topic: 'start', title: 'Creating an account', body: 'Choose Sign up, use your @hau.edu.ph email and a password of at least 8 characters. You can report items without an account, but an account lets you track and update your reports.' },
    { id: 'how-it-works', topic: 'start', title: 'How the platform works', body: 'Report what you lost or found, pin where it happened on the campus map, and browse matching reports. Hand-overs happen at the Security Office.' },
    { id: 'mobile', topic: 'start', title: 'Using it on your phone', body: 'The site works in any phone browser. Add it to your home screen from the browser menu for one-tap access.' },
    { id: 'photos', topic: 'report', title: 'Photo guidelines', body: 'Use a clear, well-lit photo of the item. Cover ID numbers, names and anything private before uploading. JPG or PNG up to 5 MB.' },
    { id: 'pinning', topic: 'report', title: 'Location pinning tips', body: 'Search the building first, then drag the pin to the exact spot. Add the room or floor in the notes, like “2nd floor, near Room 204”.' },
    { id: 'manage', topic: 'report', title: 'Managing your reports', body: 'Open My Profile to see everything you reported. Mark an item as returned once it’s back with its owner, or delete a report you no longer need.' },
    { id: 'proof', topic: 'claim', title: 'Proof of ownership', body: 'When you request to claim, describe something only the owner would know. The Security Office checks it before handing anything over.' },
    { id: 'meetup', topic: 'claim', title: 'Meet-up safety tips', body: 'Don’t meet strangers privately. Hand-overs happen at the Security Office during office hours.' },
    { id: 'pickup', topic: 'claim', title: 'Security Office pick-up', body: 'Bring your HAU ID and the report reference (it starts with HNY-). Staff will confirm your proof and release the item.' },
    { id: 'password', topic: 'account', title: 'Password recovery', body: 'Use Forgot password on the login page. In this demo you can set a new password straight away.' },
    { id: 'privacy', topic: 'account', title: 'Privacy settings', body: 'Your email is never shown on public reports. Only your first name and last initial appear.' },
    { id: 'bad-users', topic: 'account', title: 'Reporting bad users', body: 'If a claim looks fraudulent, send us a message from this page and tell the Security Office.' },
  ];

  /* Street View: real campus photos, each tied to a building on the map */
  /* Street View: real eye-level photos of campus, each tied to a building on the map.
     also = other buildings whose reports show on the same photo */
  const VIEWPOINTS = [
    { id: 'red', bldg: 'red', title: 'Plaza De Corazon (Red Bldg.)', sub: 'Building 1 · Main entrance; Human Resource Development Office and dormitory', photo: 'images/street/01-plaza-de-corazon-red-building.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'red-walk', bldg: 'red', title: 'Plaza De Corazon walkway', sub: 'Building 1 · Covered walkway beside the Red Building', photo: 'images/street/01b-plaza-de-corazon-covered-walkway.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'smt', bldg: 'smt', title: 'St. Martha Hall', sub: 'Building 2 · Admissions Office & Testing Center', photo: 'images/street/02-st-martha-hall.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'sfj', bldg: 'sfj', title: 'San Francisco De Javier (SFJ)', sub: 'Building 3 · University Library and Theater, seen from the rotunda', photo: 'images/street/03-san-francisco-de-javier-sfj.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'theater', bldg: 'sfj', title: 'University Theater', sub: 'Inside SFJ (Building 3) · Stage and audience hall', photo: 'images/street/23-university-theater.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'stl', bldg: 'stl', title: 'St. Therese of Lisieux (STL)', sub: 'Building 4 · School of Hospitality & Tourism Management', photo: 'images/street/04-st-therese-of-lisieux-stl.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'whc', bldg: 'whc', title: 'Warehouse & Carpentry', sub: 'Building 5 · Maintenance gate', photo: 'images/street/05-warehouse-and-carpentry.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'yfc', bldg: 'yfc', title: 'Yellow Food Court', sub: 'Building 6 · Dining area', photo: 'images/street/06-yellow-food-court.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'smh', bldg: 'smh', title: 'St. Michael Hall (SMH)', sub: 'Building 9', photo: 'images/street/09-st-michael-hall-smh.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'haustore', bldg: 'smh', title: 'HAU Store & walkway', sub: 'Covered walkway and stairs beside the HAU Store', photo: 'images/street/25-hau-store-walkway.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'ggn', bldg: 'ggn', title: 'Geromin G. Nepomuceno (GGN)', sub: 'Building 10 · High School Library and faculty room', photo: 'images/street/10-geromin-g-nepomuceno-ggn.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'pgn', bldg: 'pgn', title: 'Peter G. Nepomuceno (PGN)', sub: 'Building 11 · OSSA, SBA Dean’s Office, Graduate School', photo: 'images/street/11-peter-g-nepomuceno-pgn.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'main', bldg: 'djdn', title: 'Main Building (DJDN)', sub: 'Building 12 · Registrar, Finance and CKS offices', photo: 'images/street/12-don-juan-d-nepomuceno-djdn-main.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'kapampangan', bldg: 'djdn', title: 'Center for Kapampangan Studies', sub: 'Inside the Main Building (DJDN) · Museum gallery', photo: 'images/street/22-kapampangan-center-museum.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'pinatubo', bldg: 'djdn', title: 'Pinatubo Museum (DJDN courtyard)', sub: 'Inside the Main Building (DJDN) · Laus Deo Semper courtyard and museum entrance', photo: 'images/street/24-djdn-courtyard-pinatubo-museum.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'aps', bldg: 'aps', title: 'Archbishop Pedro Santos (APS)', sub: 'Building 13 · Classrooms and outdoor tables', photo: 'images/street/13-archbishop-pedro-santos-aps.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'mgn', bldg: 'mgn', title: 'Mamerto G. Nepomuceno (MGN)', sub: 'Building 14 · Nursing and Criminal Justice Dean’s Offices', photo: 'images/street/14-mamerto-g-nepomuceno-mgn.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'chapel', bldg: 'chp', title: 'Chapel of the Holy Guardian Angel', sub: 'Building 15 · Chapel and front grounds', photo: 'images/street/15-chapel-of-the-holy-guardian-angel.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'sjn', bldg: 'sjn', title: 'Sr. Josefina Nepomuceno Formation Center', sub: 'Building 16 · Formation Center', photo: 'images/street/16-sr-josefina-nepomuceno-formation-center-sjn.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'sjh', bldg: 'sjh', title: 'St. Joseph Hall (SJH)', sub: 'Building 17 · Education, Arts & Sciences and Computing; Security Office', photo: 'images/street/17-st-joseph-hall-sjh.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'sh', bldg: 'sh', title: 'Sacred Heart Courtyard', sub: 'Building 18 · Inner courtyard, School of Engineering & Architecture', photo: 'images/street/18-sacred-heart-courtyard.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'court', bldg: 'cct', title: 'Covered Court', sub: 'Building 19 · Outside view', photo: 'images/street/19-covered-court.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'court-in', bldg: 'cct', title: 'Covered Court (inside)', sub: 'Building 19 · Under the roof', photo: 'images/street/19b-covered-court-inside.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'gym-front', bldg: 'ihg', title: 'IH Gymnasium (front)', sub: 'Building 20 · Immaculate Heart Gymnasium', photo: 'images/street/20b-immaculate-heart-gym-side.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
    { id: 'gym', bldg: 'ihg', also: ['iga'], title: 'IH Gymnasium & Annex', sub: 'Buildings 20–21 · Immaculate Heart Gymnasium and its annex', photo: 'images/street/20-21-immaculate-heart-gym-and-annex.jpg', hotspots: [[30, 66], [64, 62], [47, 74], [80, 70]] },
  ];

  HNY.DATA = { BUILDINGS, ALIASES, CAMPUS, CATEGORIES, SEED, CONTACT, HAU, TEAM, STORIES, FAQ, HELP, VIEWPOINTS };
}(window.HNY));
