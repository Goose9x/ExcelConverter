import React, { useState } from "react";
import * as XLSX from "xlsx";
import ShopifyConverter from "./components/shopifyConveter";
import WooConverter from "./components/wooConverter";
import "./App.css";

export default function App() {
  const [convertedData, setConvertedData] = useState([]);
  const [shopifyName, setShopifyName] = useState("");
  const [wooName, setWooName] = useState("");

  //handle data
  const handleDataFromShopify = (dataFromA) => {
    setConvertedData((prev) => [...prev, ...dataFromA]);
  };
  const handleDataFromWoo = (dataFromB) => {
    setConvertedData((prev) => [...prev, ...dataFromB]);
  };

  //set name
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(convertedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "shopify-woo");
    XLSX.writeFile(wb, "shopify-woo" + "_converted.xlsx");
  };
  return (
    <div id="main-container">
      <ShopifyConverter
        onSendData={handleDataFromShopify}
        setUploadName={setShopifyName}
      />
      <WooConverter onSendData={handleDataFromWoo} setUploadName={setWooName} />
      {convertedData.length > 0 && shopifyName && wooName && (
        <>
          <div>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleExport}
            >
              Tải file đã xử lý
            </button>
          </div>
          {/* <table className="w-full table-auto border">
            <thead>
              <tr>
                <th className="border p-2">Created at</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Lineitem name</th>
                <th className="border p-2">Lineitem quantity</th>
                <th className="border p-2">Lineitem sku</th>
                <th className="border p-2">Shipping Name</th>
                <th className="border p-2">Shipping Street</th>
                <th className="border p-2">Shipping Address2</th>
                <th className="border p-2">Shipping City</th>
                <th className="border p-2">Shipping Zip</th>
                <th className="border p-2">Shipping Province</th>
                <th className="border p-2">Shipping Country</th>
                <th className="border p-2">Shipping Country Code</th>
                <th className="border p-2">Shipping Phone</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Customer Notes</th>
                <th className="border p-2">Personalization</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Size</th>
                <th className="border p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {convertedData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{row["Created at"]}</td>
                  <td className="border p-2">{row["Name"]}</td>
                  <td className="border p-2">{row["Lineitem name"]}</td>
                  <td className="border p-2">{row["Lineitem quantity"]}</td>
                  <td className="border p-2">{row["Lineitem sku"]}</td>
                  <td className="border p-2">{row["Shipping Name"]}</td>
                  <td className="border p-2">{row["Shipping Street"]}</td>
                  <td className="border p-2">{row["Shipping Address2"]}</td>
                  <td className="border p-2">{row["Shipping City"]}</td>
                  <td className="border p-2">{row["Shipping Zip"]}</td>
                  <td className="border p-2">{row["Shipping Province"]}</td>
                  <td className="border p-2">{row["Shipping Country"]}</td>
                  <td className="border p-2">{row["Shipping Country Code"]}</td>
                  <td className="border p-2">{row["Shipping Phone"]}</td>
                  <td className="border p-2">{row["Email"]}</td>
                  <td className="border p-2">{row["Customer Notes"]}</td>
                  <td className="border p-2">{row["Personalization"]}</td>
                  <td className="border p-2">{row["Type"]}</td>
                  <td className="border p-2">{row["Size"]}</td>
                  <td className="border p-2">{row["Notes"]}</td>
                </tr>
              ))}
            </tbody>
          </table> */}
        </>
      )}
    </div>
  );
}
