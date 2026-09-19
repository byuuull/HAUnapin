/* ============================================================
   Static data: campus buildings, categories and sample reports.
   Map units: an SVG viewBox of 1200 × 600. Sto. Rosario St. (main
   gates) is at the bottom. Building positions combine HAU's numbered
   campus map (21 buildings) with buildings that only appear on the
   older lettered map (Sta. Clara buildings, LES, Mechanical &
   Aeronautical). Positions are schematic, not survey-accurate.
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  /* x, y, w, h = roof rectangle; d = height of the visible front face (taller = bigger);
     tone = roof colour; src = which campus map the building comes from */
  const BUILDINGS = [
    // Back row
    { id: 'les', code: 'LES', name: 'Laboratory Elementary School', offices: ['Elementary classrooms'], x: 834.5, y: 81.6, w: 119.2, h: 31.4, d: 6.3, src: 'lettered' },
    { id: 'scb', code: 'SCB', name: 'Sta. Clara B Building', offices: ['Classrooms'], x: 323.1, y: 492.5, w: 47.1, h: 32.9, d: 6.3, src: 'lettered' },
    { id: 'sc', code: 'SC', name: 'Sta. Clara Building', offices: ['Classrooms'], x: 925.5, y: 119.2, w: 50.2, h: 61.2, d: 7.8, src: 'lettered' },
    { id: 'sca', code: 'SCA', name: 'Sta. Clara Annex Building', offices: ['Classrooms'], x: 756.1, y: 94.1, w: 75.3, h: 45.5, d: 7.8, src: 'lettered' },
    { id: 'ggn', code: 'GGN', name: 'Geromin G. Nepomuceno Building', offices: ["Principal's Office / Faculty Room", 'High School Library'], x: 545.9, y: 7.8, w: 138.0, h: 32.9, d: 11.0, src: 'numbered' },
    { id: 'aps', code: 'APS', name: 'Archbishop Pedro Santos Building', offices: ['Classrooms'], x: 545.9, y: 109.8, w: 138.0, h: 34.5, d: 9.4, src: 'both' },
    { id: 'sh', code: 'SH', name: 'Sacred Heart Building', offices: ["School of Engineering & Architecture Dean's Office"], x: 999.2, y: 219.6, w: 153.7, h: 75.3, d: 11.0, src: 'both' },
    { id: 'mab', code: 'MAB', name: 'Mechanical & Aeronautical Building', offices: ['Engineering laboratories'], x: 1098.0, y: 106.7, w: 56.5, h: 108.2, d: 7.8, src: 'lettered' },
    // Middle row
    { id: 'srh', code: 'SRH', name: 'St. Raphael Hall', offices: ['Classrooms'], x: 39.2, y: 439.2, w: 164.7, h: 56.5, d: 9.4, src: 'both' },
    { id: 'smh', code: 'SMH', name: 'St. Michael Hall', offices: ['Classrooms'], x: 247.8, y: 475.3, w: 72.2, h: 31.4, d: 6.3, src: 'both' },
    { id: 'sgh', code: 'SGH', name: 'St. Gabriel Hall', offices: ['Classrooms'], x: 31.4, y: 381.2, w: 153.7, h: 42.4, d: 7.8, src: 'both' },
    { id: 'yfc', code: 'Food Court', name: 'Yellow Food Court', offices: ['Food stalls', 'Dining area'], x: 395.3, y: 12.5, w: 65.9, h: 128.6, d: 6.3, tone: 'yellow', src: 'both' },
    { id: 'whc', code: 'WH', name: 'Warehouse & Carpentry', offices: ['Maintenance'], x: 392.2, y: 175.7, w: 72.2, h: 147.5, d: 6.3, src: 'both' },
    { id: 'stl', code: 'STL', name: 'St. Therese of Lisieux Building', offices: ["School of Hospitality & Tourism Management Dean's Office"], x: 654.1, y: 370.2, w: 67.5, h: 183.5, d: 11.0, src: 'both' },
    { id: 'pgn', code: 'PGN', name: 'Peter G. Nepomuceno Building', offices: ['OSSA – Scholarship & Grants Office', "School of Business & Accountancy Dean's Office", 'PGN Auditorium', 'Graduate School'], x: 423.5, y: 412.5, w: 196.1, h: 114.5, d: 14.1, src: 'both' },
    { id: 'sjn', code: 'SJN', name: 'Sister Josefina Nepomuceno Formation Center', offices: ['Formation Center'], x: 944.3, y: 352.9, w: 59.6, h: 70.6, d: 7.8, src: 'both' },
    { id: 'chp', code: 'Chapel', name: 'Chapel of the Holy Guardian Angel', offices: ['Chapel'], shape: 'circle', cx: 847.1, cy: 282.4, r: 48.6, d: 9.4, tone: 'chapel', src: 'both' },
    { id: 'cct', code: 'Court', name: 'Covered Court', offices: ['Covered court'], x: 928.6, y: 229.0, w: 47.1, h: 108.2, d: 4.7, tone: 'blue', src: 'both' },
    { id: 'ihg', code: 'IHG', name: 'Immaculate Heart Gymnasium', offices: ['Gymnasium'], x: 1058.8, y: 313.7, w: 102.0, h: 172.5, d: 12.5, src: 'both' },
    { id: 'iga', code: 'IHGA', name: 'Immaculate Heart Gymnasium Annex', offices: ['Gymnasium annex'], x: 1066.7, y: 502.0, w: 128.6, h: 28.2, d: 6.3, src: 'both' },
    // Front row
    { id: 'red', code: 'Red', name: 'Plaza De Corazon Building (Red Bldg.)', offices: ['Human Resource Development Office', 'Dormitory'], x: 75.3, y: 230.6, w: 43.9, h: 42.4, d: 9.4, tone: 'red', src: 'both' },
    { id: 'smt', code: 'SMT', name: 'St. Martha Hall', offices: ['Admissions Office & Testing Center', 'Dormitory'], x: 119.2, y: 216.5, w: 65.9, h: 131.8, d: 9.4, src: 'both' },
    { id: 'sfj', code: 'SFJ', name: 'San Francisco De Javier Building', offices: ["President's Office", 'University Library', 'University Theater'], x: 219.6, y: 208.6, w: 102.0, h: 142.7, d: 12.5, src: 'both' },
    { id: 'djdn', code: 'DJDN', name: 'Don Juan D. Nepomuceno Building (Main Bldg.)', offices: ["Registrar's Office", 'Finance Office', 'CKS Office'], x: 470.6, y: 175.7, w: 207.1, h: 147.5, d: 9.4, courtyard: true, src: 'both' },
    { id: 'mgn', code: 'MGN', name: 'Mamerto G. Nepomuceno Building', offices: ["School of Nursing & Applied Medical Sciences Dean's Office", "College of Criminal Justice Education & Forensics Dean's Office"], x: 757.6, y: 481.6, w: 262.0, h: 48.6, d: 11.0, src: 'both' },
    { id: 'sjh', code: 'SJH', name: 'St. Joseph Hall', offices: ["School of Education Dean's Office", "School of Arts & Sciences Dean's Office", "School of Computing Dean's Office", 'Academic Hall'], x: 975.7, y: 81.6, w: 119.2, h: 61.2, d: 11.0, src: 'both' },
  ];

  /* Campus grounds inside the perimeter fence, traced from the campus plan:
     drive lanes, walkways, lawns, plaza, trees and gates. There is no parking inside the campus, so none is drawn. */
  const CAMPUS = {"width": 1200, "height": 600, "boundary": "M18.8 163.1 L274.5 163.1 L274.5 4.7 L693.3 4.7 L709.0 65.9 L1200.0 75.3 L1200.0 549.0 L737.3 574.1 L624.3 574.1 L384.3 552.2 L18.8 530.2 Z", "bbox": {"x0": 7.8, "y0": -6.3, "x1": 1207.8, "y1": 586.7}, "drives": [{"d": "M18.8 178.8 L354.5 178.8 L367.1 166.3 L709.0 163.1", "w": 20.4}, {"d": "M367.1 166.3 L367.1 552.2", "w": 22.0}, {"d": "M367.1 357.6 L724.7 357.6", "w": 20.4}, {"d": "M294.9 4.7 L294.9 163.1", "w": 17.3}, {"d": "M502.0 4.7 L502.0 163.1", "w": 18.8}, {"d": "M709.0 163.1 L720.0 235.3 L720.0 411.0 L737.3 454.9 L784.3 459.6 L1022.7 459.6", "w": 20.4}, {"d": "M737.3 454.9 L740.4 574.1", "w": 20.4}, {"d": "M709.0 163.1 L925.5 163.1 L988.2 163.1", "w": 18.8}, {"d": "M988.2 163.1 L988.2 316.9 L1029.0 329.4 L1029.0 552.2", "w": 18.8}], "walks": [{"d": "M392.2 338.8 L677.6 338.8", "w": 9.4}, {"d": "M276.1 385.9 L276.1 363.9", "w": 9.4}, {"d": "M298.0 423.5 L363.9 470.6", "w": 9.4}, {"d": "M251.0 423.5 L203.9 470.6", "w": 7.8}, {"d": "M737.3 376.5 L792.2 332.5", "w": 9.4}, {"d": "M776.5 436.1 L815.7 345.1", "w": 9.4}, {"d": "M847.1 241.6 L847.1 175.7", "w": 9.4}, {"d": "M897.3 307.5 L928.6 307.5", "w": 7.8}, {"d": "M795.3 153.7 L795.3 166.3", "w": 7.8}, {"d": "M757.6 473.7 L1019.6 473.7", "w": 6.3}, {"d": "M1007.1 214.9 L1094.9 214.9", "w": 6.3}, {"d": "M655.7 363.9 L721.6 363.9", "w": 6.3}], "promenade": {"cx": 847.1, "cy": 291.8, "r": 72.2}, "lawns": ["M282.4 12.5 L313.7 12.5 L313.7 153.7 L282.4 153.7 Z", "M470.6 56.5 L542.7 56.5 L542.7 103.5 L470.6 103.5 Z", "M545.9 54.9 L683.9 54.9 L683.9 105.1 L545.9 105.1 Z", "M674.5 31.4 L752.9 47.1 L752.9 150.6 L690.2 150.6 Z", "M373.3 188.2 L389.0 188.2 L389.0 329.4 L373.3 329.4 Z", "M203.9 373.3 L354.5 373.3 L354.5 470.6 L235.3 470.6 L203.9 447.1 Z", "M384.3 376.5 L420.4 376.5 L420.4 542.7 L384.3 542.7 Z", "M622.7 370.2 L651.0 370.2 L651.0 541.2 L622.7 541.2 Z", "M734.1 175.7 L922.4 175.7 L922.4 445.5 L752.9 445.5 L734.1 411.0 Z", "M1007.1 169.4 L1094.9 169.4 L1094.9 213.3 L1007.1 213.3 Z", "M18.8 511.4 L235.3 517.6 L235.3 527.1 L18.8 527.1 Z", "M1160.8 227.5 L1198.4 227.5 L1198.4 307.5 L1160.8 307.5 Z"], "pool": {"x": 729.4, "y": 251.0, "w": 47.1, "h": 81.6}, "roundabout": {"cx": 276.1, "cy": 411.0, "r": 26.7}, "trees": [[768.6, 200.8], [800.0, 189.8], [826.7, 188.2], [858.0, 189.8], [886.3, 205.5], [865.9, 233.7], [776.5, 229.0], [740.4, 216.5], [878.4, 367.1], [919.2, 387.5], [800.0, 426.7], [818.8, 429.8], [872.2, 395.3], [897.3, 417.3], [677.6, 197.6], [677.6, 251.0], [701.2, 235.3], [298.0, 31.4], [298.0, 78.4], [298.0, 125.5], [633.7, 392.2], [633.7, 454.9], [633.7, 517.6], [400.0, 392.2], [404.7, 470.6], [404.7, 525.5], [227.5, 454.9], [337.3, 454.9], [1082.4, 178.8], [572.5, 78.4], [643.1, 78.4]], "gates": [{"label": "Gate 1", "x": 367.1, "y": 552.2, "dir": "down"}, {"label": "Sto. Rosario Gate", "x": 738.8, "y": 574.1, "dir": "down"}, {"label": "St. Raphael Gate", "x": 1029.0, "y": 550.6, "dir": "down"}, {"label": "North Gate", "x": 502.0, "y": 4.7, "dir": "up"}, {"label": "West Gate", "x": 62.7, "y": 163.1, "dir": "up"}], "landmarks": [{"label": "Epiphany of Angels", "x": 1057.3, "y": 197.6}, {"label": "Plaza", "x": 847.1, "y": 373.3}]};

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
    { title: 'Blue Thesis Binder', cat: 'books', status: 'found', bldg: 'sc', spot: 'Ground floor corridor', hoursAgo: 400, desc: 'Blue ring binder with printed thesis chapters and sketches.', by: 'Security Office', state: 'returned' , photo: 'images/items/binder.jpg' },
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
  const VIEWPOINTS = [
    { id: 'main', bldg: 'djdn', title: 'Main Building', sub: 'Don Juan D. Nepomuceno Building, facing the front plaza', photo: 'images/campus/main-building.jpg', hotspots: [[30, 58], [72, 52], [52, 64]] },
    { id: 'stl', bldg: 'stl', title: 'St. Therese of Lisieux', sub: 'North view, facing the University Library', photo: 'images/campus/hau-aerial.jpg', hotspots: [[44, 52], [28, 64], [60, 40]] },
    { id: 'campus', bldg: 'chp', title: 'Chapel & campus grounds', sub: 'Looking across the campus from the chapel', photo: 'images/campus/hau-campus.jpg', hotspots: [[24, 62], [58, 50], [80, 60]] },
  ];

  HNY.DATA = { BUILDINGS, CAMPUS, CATEGORIES, SEED, CONTACT, HAU, TEAM, STORIES, FAQ, HELP, VIEWPOINTS };
}(window.HNY));
