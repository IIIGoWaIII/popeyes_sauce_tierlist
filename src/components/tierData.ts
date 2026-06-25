import type { Tier } from './TierList';

const IMG = (id: string) =>
`https://cdn.magicpatterns.com/patterns/figma-images/XQjA9zKUQPuGYkKme2ErGD/${id}.png`;

export const GOWA_LOGO = `${import.meta.env.BASE_URL}0-5.svg`;
export const KATA_LOGO = `${import.meta.env.BASE_URL}0-65.svg`;

export const GOWA_DEFAULT: Tier[] = [
{
  label: 'S',
  color: '#BB5757',
  items: [
  { id: 'gowa-voodoo', name: 'Voodoo', image: IMG('0-17') },
  { id: 'gowa-halapeno', name: 'halapeno', image: IMG('0-20') },
  { id: 'gowa-ser', name: 'ser', image: IMG('0-23') }]
},
{
  label: 'A',
  color: '#C57746',
  items: [{ id: 'gowa-cebula', name: 'cebula', image: IMG('0-30') }]
},
{
  label: 'B',
  color: '#D1BE43',
  items: [{ id: 'gowa-ranch', name: 'Ranch', image: IMG('0-37') }]
},
{
  label: 'C',
  color: '#8EBB57',
  items: [{ id: 'gowa-bbq', name: 'bbq ser', image: IMG('0-87') }]
},
{
  label: 'D',
  color: '#57BB81',
  items: [
  { id: 'gowa-ghost', name: 'ghost peper', image: IMG('0-51') }]
},
{
  label: '?',
  color: '#6457BB',
  items: [{ id: 'gowa-honey', name: 'red honey', image: IMG('0-61') }]
}];

export const KATA_DEFAULT: Tier[] = [
{
  label: 'S',
  color: '#BB5757',
  items: [
  { id: 'kata-voodoo', name: 'Voodoo', image: IMG('0-77') },
  { id: 'kata-halapeno', name: 'halapeno', image: IMG('0-80') }]
},
{
  label: 'A',
  color: '#C57746',
  items: [
  { id: 'kata-bbq', name: 'bbq ser', image: IMG('0-87') },
  { id: 'kata-ser', name: 'ser', image: IMG('0-90') }]
},
{
  label: 'B',
  color: '#D1BE43',
  items: [{ id: 'kata-cebula', name: 'cebula', image: IMG('0-97') }]
},
{
  label: 'C',
  color: '#8EBB57',
  items: [
  { id: 'kata-ranch', name: 'Ranch', image: IMG('0-104') },
  { id: 'kata-ghost', name: 'ghost peper', image: IMG('0-107') }]
},
{
  label: 'D',
  color: '#57BB81',
  items: []
},
{
  label: '?',
  color: '#6457BB',
  items: [{ id: 'kata-honey', name: 'red honey', image: IMG('0-118') }]
}];