import React, { useState } from "react";
import * as XLSX from "xlsx";
import moment from "moment";

export default function ShopifyConverter({ onSendData, setUploadName }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setUploadName(file.name.replace(/\.(csv|xlsx)$/, ""));
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      // Chuyển đổi dữ liệu
      const transformed = jsonData
        .map((row) => {
          return {
            "Created at": row["( Order ) Create date"],
            Name: row["( Order ) Order Number"],
            "Lineitem name": row["( Order Item ) Product Name"],
            "Lineitem quantity": row["( Order Item ) Item Quantity"],
            "Lineitem sku": row["( Order Item ) Product Sku"],
            "Shipping Name":
              row["( Shipping ) First Name"] +
              " " +
              row["( Shipping ) Last Name"],
            "Shipping Street": row["( Shipping ) Address 1"],
            "Shipping Address2": row["( Shipping ) Address 2"], // Trống
            "Shipping City": row["( Shipping ) City"],
            "Shipping Zip": row["( Shipping ) Postcode"],
            "Shipping Province": row["( Shipping ) State Code"],
            "Shipping Country": row["( Shipping ) Country Name"],
            "Shipping Country Code": row["( Shipping ) Country Code"], // Trống
            "Shipping Phone": row["( Billing ) Phone"],
            Email: row["( Billing ) Email"],
            "Customer Notes": row["( Order ) Customer Note"], // Trống
            Personalization: row["( Order Item )Your Text (Optional)"],
            Type: getFirstStype(row["( Order Item )Style:"]).replace(
              /\s\(\+\$\d+\)/,
              ""
            ),
            Size: getFirstStype(row["( Order Item )Size:"]),
            Notes: "",
            "( Order Item ) Product Image Link":
              row["( Order Item ) Product Image Link"],
            "( Order Item ) Product Link": row["( Order Item ) Product Link"],
            "( Order ) Payment Method Title":
              row["( Order ) Payment Method Title"],
            "( Order ) Total": row["( Order ) Total"],
            "( Order ) Order Status": row["( Order ) Order Status"],
          };
        })
        .filter((row) => Object.keys(row).length > 0); // Remove {}
      onSendData(transformed);
    };

    reader.readAsArrayBuffer(file);
  };
  const getFirstStype = (row) => {
    if (row) {
      row = row.split("|");
      return row[0];
    } else {
      return "";
    }
  };
  return (
    <div className="p-4 space-y-4 uploader">
      <h1 className="text-xl font-bold">Tải file Woo</h1>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />
    </div>
  );
}
