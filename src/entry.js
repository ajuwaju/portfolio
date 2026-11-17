import { mount } from './paper.jsx';
const el = document.getElementById('paper3d');
try { const c = document.createElement('canvas'); if (el && (c.getContext('webgl2') || c.getContext('webgl'))) mount(el, document.querySelector('.hero')); } catch (e) { console.warn(e); }
