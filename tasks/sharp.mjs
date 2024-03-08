import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import dir from './dir.mjs';
import sharp from 'sharp';

const inputBaseDir = dir.src.img;
const outputBaseDir = dir.dist.img;

const inputPath = '/src/img/common/dummy_jpg.jpg';

const outputDir = path.join(outputBaseDir, path.relative(inputBaseDir, path.dirname(inputPath)));
const outputPath = path.join(outputBaseDir, path.relative(inputBaseDir, inputPath));

const semiTransparentRedPng = await sharp({
  create: {
    width: 48,
    height: 48,
    channels: 4,
    background: { r: 255, g: 0, b: 0, alpha: 0.5 },
  },
})
  .png()
  .toBuffer();
