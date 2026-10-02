// Content for the interactive sections. Venue and package names come from the
// Aviora Travista brochure (spellings corrected).

// public files live under Vite's base URL ('/' locally, '/aviora-travista/' on GitHub Pages)
const BASE = import.meta.env.BASE_URL;
const img = (name, size = '') => `${BASE}media/img/${name}${size ? '-' + size : ''}.webp`;

export const reel = [
  { key: 'kerala', place: 'Backwaters of Kerala', short: 'Kerala' },
  { key: 'munnar', place: 'Golden hour over Munnar', short: 'Munnar' },
  { key: 'taj', place: 'The Taj Mahal, Agra', short: 'Agra' },
  { key: 'himalaya', place: 'The Himalayas', short: 'Himalaya' },
  { key: 'hogenakkal', place: 'Hogenakkal Falls', short: 'Hogenakkal' },
  { key: 'goa', place: 'The coast of Goa', short: 'Goa' },
];

export const trips = [
  { name: 'Coorg Nature Camp', time: '06:10', msg: 'Coach departed · 46 on board', img: img('coorg', 'sm') },
  { name: 'Wonderla Day Trip', time: '09:30', msg: 'Gates open, wristbands issued', img: img('amusement', 'sm') },
  { name: 'HAL Aerospace Museum', time: '11:00', msg: 'Guided tour started', img: img('museum', 'sm') },
  { name: 'Kerala Backwaters', time: '07:45', msg: 'Houseboat check-in done', img: img('kerala-houseboat', 'sm') },
  { name: 'Industrial Visit', time: '10:15', msg: 'Safety briefing complete', img: img('factory', 'sm') },
  { name: 'Singapore · Malaysia', time: '14:20', msg: 'Landed at Changi', img: img('pk-singapore', 'sm') },
];

export const feed = [
  { time: '06:10', text: 'Coach departed Bengaluru — 42 students and 4 teachers on board.' },
  { time: '08:45', text: 'Breakfast stop done. Headcount 46/46 ✓' },
  { time: '11:20', text: 'Reached Abbey Falls. Parents have been notified.' },
  { me: true, text: 'Can we add the Dubare elephant camp tomorrow?' },
  { time: '11:24', text: 'Done — added for 9:00 am. Updated itinerary shared with parents.' },
  { time: '13:30', text: 'Lunch at the homestay — two vegetarian and one nut-free meal served as requested.' },
];

export const tickerWords = ['Booking coaches…', 'Confirming rooms…', 'Issuing tickets…', 'Briefing guides…', 'Arranging insurance…'];

export const categories = [
  { label: 'Amusement Parks', img: 'amusement', lead: 'Thrill rides and water parks.', desc: 'A classic class outing — tickets, transport, meals and supervision handled end to end.',
    venues: ['Wonderla Amusement Park', 'Jollywood Adventure Studio', 'Fun World Amusement Park', 'Play Arena', 'GRS Fantasy Park (Mysuru)'] },
  { label: 'Resorts', img: 'resort', lead: 'Adventure and nature resorts.', desc: 'Day-outs and overnight stays with activities for every age group.',
    venues: ['Club Cabana', 'Ruppi’s Resort', 'Gold Coin Resort', 'Guhantara Resort', 'RD’s Nature Retreat', 'Mango Mist Resort', 'Wild Valley Resort', 'Odyssey Resort', 'Rocksport', 'Area 83', 'Suggee’s Resort', 'Discovery Village', 'Eagles Unbound', 'Elim’s Resort', 'Adventure Village', 'Hombale Adventure Resort'] },
  { label: 'Farms', img: 'farm', lead: 'Hands-on days outdoors.', desc: 'Animals, crops and rural life — a favourite for younger grades.',
    venues: ['Sri Bhagyalakshmi Farm', 'Big Barn Farm', 'Enchanting Acres', 'Eden Farm', 'Chukki Mane Prani Farms', 'Martin Farms', 'Jain Farms'] },
  { label: 'Zoos & Parks', img: 'zoo', lead: 'Wildlife and green spaces.', desc: 'Gardens, parks and safaris in and around Bengaluru and Mysuru.',
    venues: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bannerghatta National Park', 'Mysuru Zoo'] },
  { label: 'Experience Centres', img: 'experience-centre', lead: 'Learning that sticks.', desc: 'Science, space and play-based centres that turn lessons into experiences.',
    venues: ['Param Science Experience Centre', 'Kidztopiaa', 'CurioCity Science Centre', 'Jawahar Bal Bhavan', 'Breakout', 'Slurp Studio', 'Mad Labs', 'Rangoli Garden', 'Nehru Planetarium', 'Jakkur Mini Flight Experience Centre'] },
  { label: 'Museums', img: 'museum', lead: 'History, art and aerospace.', desc: 'Guided museum visits across Bengaluru, from aircraft to folk art.',
    venues: ['HAL Aerospace Museum', 'Military Museum', 'Government Art Museum', 'Visvesvaraya Technological Museum', 'NIMHANS Brain Museum', 'Agriculture Science Museum', 'Payana Vintage Car Museum', 'Indian Music Experience', 'Janapada Loka', 'Chitra Kala Parishath', 'Nrityagram Dance Village'] },
  { label: 'Industrial Tours', img: 'factory', lead: 'See how things are made.', desc: 'One-day visits to real factory floors, with safety briefings arranged in advance.',
    venues: ['Parle Biscuits Factory', 'Rail Wheel Factory', 'Dairy Day Ice Cream Factory', 'Mysore Sandal Soap Factory', 'GKVK', 'Silk Factory', 'TVS Factory', 'BMRCL Plant', 'Bosch Ltd', 'Volvo India Pvt Ltd', 'Rajamane & Hegde Industries', 'Cipla Ltd'] },
  { label: 'Power Plants', img: 'power-plant', lead: 'Long-tour industrial visits.', desc: 'Hydro, nuclear and renewable energy sites for engineering students.',
    venues: ['Kaiga Nuclear Power Plant', 'Sharavathi Hydro Power Plant', 'Varahi Underground Powerhouse', 'Mithradham Renewable Energy Centre', 'Shivanasamudra Hydro Power Plant'] },
].map((c) => ({ ...c, src: img(c.img), thumb: img(c.img, 'sm') }));

export const regions = [
  { name: 'Weekend getaways', type: 'School / college tour',
    trips: [
      { tag: 'Heritage city', title: 'Mysuru', img: 'pk-mysuru' },
      { tag: 'Coffee country', title: 'Coorg', img: 'coorg' },
      { tag: 'Waterfalls', title: 'Hogenakkal Falls', img: 'pk-hogenakkal' },
      { tag: 'Coffee hills', title: 'Chikkamagaluru', img: 'd-chikmagalur' },
      { tag: 'Hoysala temples', title: 'Beluru · Halebidu', img: 'd-belur' },
      { tag: 'Wine country', title: 'Vineyard tour', img: 'd-vineyard' },
      { tag: 'Sunrise trek', title: 'Bilikal Rangaswamy Betta', img: 'd-bilikal' },
    ] },
  { name: 'South India', type: 'Domestic holiday',
    trips: [
      { tag: 'Kerala', title: 'Alleppey · Varkala', img: 'pk-alleppey' },
      { tag: 'Coastal Karnataka', title: 'Murudeshwara · Honnavar · Udupi', img: 'murudeshwar' },
      { tag: 'Kerala hills', title: 'Kochi · Munnar · Wayanad', img: 'pk-munnar' },
      { tag: 'Heritage', title: 'Hampi · Bijapur', img: 'pk-hampi' },
      { tag: 'Rivers & beaches', title: 'Dandeli · Karwar · Gokarna', img: 'd-gokarna' },
      { tag: 'Western Ghats', title: 'Sakleshpur · Mangaluru', img: 'd-sakleshpur' },
      { tag: 'Beaches', title: 'Goa', img: 'd-goa' },
      { tag: 'Malabar coast', title: 'Calicut · Mahe', img: 'd-calicut' },
      { tag: 'Land’s end', title: 'Kanyakumari · Rameswaram · Dhanushkodi', img: 'd-kanyakumari' },
      { tag: 'The Nilgiris', title: 'Coimbatore · Ooty', img: 'd-ooty' },
      { tag: 'French quarter', title: 'Pondicherry · Auroville', img: 'd-pondicherry' },
    ] },
  { name: 'North India', type: 'Domestic holiday',
    trips: [
      { tag: 'Golden Triangle', title: 'Delhi · Agra', img: 'pk-agra' },
      { tag: 'Himachal', title: 'Shimla · Manali · Sissu', img: 'pk-manali' },
      { tag: 'Uttarakhand', title: 'Haridwar · Rishikesh · Dehradun · Mussoorie', img: 'pk-rishikesh' },
      { tag: 'The Northeast', title: 'Darjeeling · Guwahati', img: 'pk-darjeeling' },
      { tag: 'Punjab', title: 'Amritsar · Wagah Border', img: 'd-amritsar' },
      { tag: 'Kashmir', title: 'Srinagar · Sonamarg · Gulmarg', img: 'd-kashmir' },
      { tag: 'Rajasthan', title: 'Delhi · Jaipur', img: 'd-jaipur' },
      { tag: 'Maharashtra', title: 'Pune · Lonavala · Aurangabad · Mahabaleshwar', img: 'd-maharashtra' },
    ] },
  { name: 'International', type: 'International holiday',
    trips: [
      { tag: 'South-East Asia', title: 'Singapore · Malaysia', img: 'pk-singapore' },
      { tag: 'Middle East', title: 'Dubai', img: 'pk-dubai' },
      { tag: 'East Asia', title: 'Japan', img: 'pk-japan' },
      { tag: 'Indian Ocean', title: 'Sri Lanka', img: 'pk-srilanka' },
      { tag: 'Multi-country', title: 'Europe', img: 'd-europe' },
      { tag: 'East Asia', title: 'Hong Kong', img: 'd-hongkong' },
      { tag: 'South-East Asia', title: 'Vietnam', img: 'd-vietnam' },
      { tag: 'Indonesia', title: 'Bali', img: 'd-bali' },
      { tag: 'Island escape', title: 'Andaman & Nicobar Islands', img: 'd-andaman' },
    ] },
].map((r) => ({ ...r, trips: r.trips.map((t) => ({ ...t, src: img(t.img), thumb: img(t.img, 'sm') })) }));

export const clients = [
  ['c01', 'Vemana Institute of Technology'], ['c02', 'New Horizon College of Engineering'], ['c03', 'Partner institution'],
  ['c04', 'Bangalore Institute of Technology'], ['c05', 'CMR'], ['c06', 'Rishi Public School'], ['c07', 'Vagdevi Vilas Institutions'],
  ['c08', 'Siddaganga Institute of Technology'], ['c09', 'Mount Carmel College'], ['c10', 'St Joseph’s College of Law'],
  ['c11', 'Partner institution'], ['c12', 'Edify School, Kanakapura Road'], ['c13', 'Global Academy for Learning'],
].map(([file, name]) => ({ src: `${BASE}media/clients/${file}.png`, name }));
