import path from 'path';

const srcBase = 'src/';
const distBase = 'dist/';

const dir = {
  src: {
    root: path.join(srcBase),
    html: path.join(srcBase, 'html/'),
    ejs: path.join(srcBase, 'ejs/'),
    php: path.join(srcBase, 'php/'),
    css: path.join(srcBase, 'css/'),
    sass: path.join(srcBase, 'sass/'),
    js: path.join(srcBase, 'js/'),
    img: path.join(srcBase, 'img/'),
    font: path.join(srcBase, 'font/'),
  },
  dist: {
    root: path.join(distBase),
    html: path.join(distBase),
    php: path.join(distBase),
    css: path.join(distBase, 'css/'),
    js: path.join(distBase, 'js/'),
    img: path.join(distBase, 'img/'),
    font: path.join(distBase, 'font/'),
  },
};

export default dir;
