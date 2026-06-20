export type Resource = 'Power' | 'Fuel' | 'Water' | 'Meals'

export type Offer = { resource: Resource; amount: string }

export type ExchangeUser = {
  id: string
  name: string
  fullName: string
  photo: string
  distance: string
  online: boolean
  availableUntil: string
  gives: Offer | null
  wants: Offer | null
}

const OFFERS: Offer[] = [
  { resource: 'Fuel', amount: '5L' },
  { resource: 'Fuel', amount: '10L' },
  { resource: 'Fuel', amount: '20L' },
  { resource: 'Power', amount: '2.5' },
  { resource: 'Power', amount: '4.2' },
  { resource: 'Power', amount: '8' },
  { resource: 'Water', amount: '15L' },
  { resource: 'Water', amount: '30L' },
  { resource: 'Meals', amount: '2' },
  { resource: 'Meals', amount: '4' },
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Distinct names. The first is "Liron M." to match the Figma reference design.
const NAMES: Array<{ name: string; fullName: string }> = [
  { name: 'Liron M.', fullName: 'Liron Mashiah' },
  { name: 'Sara M.', fullName: 'Sara Mashiah' },
  { name: 'Noa L.', fullName: 'Noa Levi' },
  { name: 'Yael C.', fullName: 'Yael Cohen' },
  { name: 'Tamar A.', fullName: 'Tamar Avrahami' },
  { name: 'Maya B.', fullName: 'Maya Ben-David' },
  { name: 'Shira F.', fullName: 'Shira Friedman' },
  { name: 'Dana K.', fullName: 'Dana Katz' },
  { name: 'Roni S.', fullName: 'Roni Shapira' },
  { name: 'Adi P.', fullName: 'Adi Peretz' },
  { name: 'Gal M.', fullName: 'Gal Mizrahi' },
  { name: 'Lior A.', fullName: 'Lior Azoulay' },
  { name: 'Omer B.', fullName: 'Omer Bar' },
  { name: 'Itai G.', fullName: 'Itai Goldberg' },
  { name: 'Eitan S.', fullName: 'Eitan Shani' },
  { name: 'Yarden R.', fullName: 'Yarden Rosen' },
  { name: 'Amit S.', fullName: 'Amit Segal' },
  { name: 'Nadav K.', fullName: 'Nadav Kaplan' },
  { name: 'Tom H.', fullName: 'Tom Harel' },
  { name: 'Ido B.', fullName: 'Ido Benshimol' },
  { name: 'Daniel W.', fullName: 'Daniel Weiss' },
  { name: 'Ron G.', fullName: 'Ron Gabay' },
  { name: 'Ayala D.', fullName: 'Ayala Dahan' },
  { name: 'Hila B.', fullName: 'Hila Barak' },
  { name: 'Noam K.', fullName: 'Noam Klein' },
  { name: 'Ella S.', fullName: 'Ella Sharon' },
  { name: 'Talia V.', fullName: 'Talia Vardi' },
  { name: 'Yonatan A.', fullName: 'Yonatan Adler' },
  { name: 'Ariel L.', fullName: 'Ariel Lev' },
  { name: 'Shai N.', fullName: 'Shai Naor' },
  { name: 'Bar T.', fullName: 'Bar Tal' },
  { name: 'Michal O.', fullName: 'Michal Oren' },
  { name: 'Aviv C.', fullName: 'Aviv Carmel' },
  { name: 'Guy M.', fullName: 'Guy Maimon' },
  { name: 'Renana H.', fullName: 'Renana Hadad' },
  { name: 'Ofir E.', fullName: 'Ofir Elbaz' },
  { name: 'Inbal Z.', fullName: 'Inbal Zohar' },
  { name: 'Liel S.', fullName: 'Liel Sasson' },
  { name: 'Matan D.', fullName: 'Matan Doron' },
  { name: 'Carmel R.', fullName: 'Carmel Raviv' },
  { name: 'Yuval S.', fullName: 'Yuval Stern' },
  { name: 'Neta G.', fullName: 'Neta Gross' },
  { name: 'Eden A.', fullName: 'Eden Avgi' },
  { name: 'Tal B.', fullName: 'Tal Brenner' },
  { name: 'Moran L.', fullName: 'Moran Lavi' },
]

const DISTANCES = ['120 M', '300 M', '450 M', '650 M', '800 M', '1.2 KM']
const UNTIL = ['18 PM', '19 PM', '20 PM', '22 PM']

function build(prefix: string, count: number, nameOffset: number): ExchangeUser[] {
  return Array.from({ length: count }, (_, i) => {
    const id = `${prefix}${i}`
    const n = NAMES[(nameOffset + i) % NAMES.length]
    const h = hash(id)
    const hasRequest = h % 3 !== 0 // ~2/3 have an active request
    return {
      id,
      name: n.name,
      fullName: n.fullName,
      photo: `https://i.pravatar.cc/150?u=${id}`,
      distance: DISTANCES[i % DISTANCES.length],
      online: hasRequest,
      availableUntil: UNTIL[i % UNTIL.length],
      gives: hasRequest ? OFFERS[h % OFFERS.length] : null,
      wants: hasRequest ? OFFERS[(h + 3) % OFFERS.length] : null,
    }
  })
}

export const FRIENDS: ExchangeUser[] = build('f', 24, 0)
export const NEIGHBORS: ExchangeUser[] = build('n', 18, 24)
