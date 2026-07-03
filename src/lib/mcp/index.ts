import { defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";

export default defineMcp({
  name: "puthiyam-products-mcp",
  title: "Puthiyam Products",
  version: "0.1.0",
  instructions:
    "Tools for the Puthiyam Products storefront. Use `search_products` to browse the catalog and `get_product` to fetch full details including variants and images.",
  tools: [searchProducts, getProduct],
});