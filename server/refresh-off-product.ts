import { syncProductFromOpenFoodFacts } from './src/productFinder.js';

const barcode = process.argv[2];

if (!barcode) {
  console.error('Usage: npx tsx refresh-off-product.ts <barcode>');
  process.exitCode = 1;
} else {
  const product = await syncProductFromOpenFoodFacts(barcode);

  if (!product) {
    console.error(`Unable to refresh Open Food Facts product: ${barcode}`);
    process.exitCode = 1;
  } else {
    console.log('Open Food Facts product refreshed:', {
      barcode,
      productId: product.id,
      name: product.name,
    });
  }
}
