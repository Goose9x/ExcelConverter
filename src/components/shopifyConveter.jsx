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

      let previousData;
      let indexNo = 0;
      // Chuyển đổi dữ liệu
      const transformed = jsonData
        .map((row) => {
          indexNo = indexNo + 1;
          if (row["Paid at"] && row["Billing Name"] && row["Billing City"]) {
            previousData = row;
            indexNo = 0;
          }
          if (
            row["Lineitem name"]
              .toLowerCase()
              .startsWith("add on".toLowerCase()) ||
            row["Lineitem name"]
              .toLowerCase()
              .startsWith("tip".toLowerCase()) ||
            row["Lineitem name"]
              .toLowerCase()
              .startsWith("Shipping Fee".toLowerCase()) ||
            row["Lineitem name"]
              .toLowerCase()
              .startsWith("Resend Fee".toLowerCase())
          ) {
            indexNo = indexNo - 1;
            return {}; // Trả về đối tượng rỗng nếu bắt đầu bằng "add on" hoặc "tip"
          }
          var noteResult = handleProcessNotes(previousData);
          return {
            "Created at": getCreatedAt(row, previousData),
            Name: row["Name"],
            "Lineitem name": row["Lineitem name"],
            "Lineitem quantity": row["Lineitem quantity"],
            "Lineitem sku": getLineitemSku(row, previousData),
            "Shipping Name": getShippingName(row, previousData),
            "Shipping Street": getShippingStreet(row, previousData),
            "Shipping Address2": "", // Trống
            "Shipping City": getShippingCity(row, previousData),
            "Shipping Zip": getShippingZip(row, previousData),
            "Shipping Province": getShippingProvince(row, previousData),
            "Shipping Country": getShippingCountry(row, previousData),
            "Shipping Country Code": "", // Trống
            "Shipping Phone": getShippingPhone(row, previousData),
            Email: getEmail(row),
            "Customer Notes": "", // Trống
            Personalization: noteResult[indexNo]?.Personal,
            Type: noteResult[indexNo]?.Type || noteResult[indexNo]?.Style,
            Size:
              noteResult[indexNo]?.Size ||
              noteResult[indexNo]?.["Men Size"] ||
              noteResult[indexNo]?.["Women Size"] ||
              noteResult[indexNo]?.["Kid Size"],
            Notes: row["Notes"],
          };
        })
        .filter((row) => Object.keys(row).length > 0); // Remove {}
      onSendData(transformed);
    };

    reader.readAsArrayBuffer(file);
  };
  //process data
  const getCreatedAt = (row, previousData) => {
    return row["Paid at"]
      ? convertTime(row["Paid at"])
      : row["Name"] === previousData["Name"]
      ? convertTime(previousData["Paid at"])
      : "";
  };
  const getLineitemSku = (row, previousData) => {
    return row["Lineitem sku"]
      ? row["Lineitem sku"]
      : row["Name"] === previousData["Name"]
      ? previousData["Lineitem sku"]
      : "";
  };
  const getShippingName = (row, previousData) => {
    return row["Shipping Name"]
      ? row["Shipping Name"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Name"]
      : "";
  };
  const getShippingStreet = (row, previousData) => {
    return row["Shipping Street"]
      ? row["Shipping Street"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Street"]
      : "";
  };
  const getShippingCity = (row, previousData) => {
    return row["Shipping City"]
      ? row["Shipping City"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping City"]
      : "";
  };
  const getShippingZip = (row, previousData) => {
    return row["Shipping Zip"]
      ? row["Shipping Zip"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Zip"]
      : "";
  };
  const getShippingProvince = (row, previousData) => {
    return row["Shipping Province"]
      ? row["Shipping Province"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Province"]
      : "";
  };
  const getShippingCountry = (row, previousData) => {
    return row["Shipping Country"]
      ? row["Shipping Country"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Country"]
      : "";
  };
  const getShippingPhone = (row, previousData) => {
    return row["Shipping Phone"]
      ? row["Shipping Phone"]
      : row["Name"] === previousData["Name"]
      ? previousData["Shipping Phone"]
      : "";
  };
  const getEmail = (row) => {
    return row["Email"] || "";
  };

  // end process data
  const convertTime = (time) => {
    if (typeof time === "number") {
      const jsDate = moment.utc((time - 25569) * 86400 * 1000);
      const formattedDate = jsDate.format("M/D/YYYY HH:mm");
      return formattedDate;
    } else {
      return time;
    }
  };

  // Xử lý NOTES
  const isTypeOrStyleLine = (line) =>
    line.startsWith("Type") || line.startsWith("Style");

  const isSizeLine = (line) =>
    line.startsWith("Size") ||
    line.startsWith("Men Size") ||
    line.startsWith("Women Size") ||
    line.startsWith("Kid Size");

  const isPersonalizationLine = (line) =>
    line.startsWith("Your Personalization (Optional):") ||
    line.startsWith("Custom Name") ||
    line.startsWith("Your Name");

  const isComboLine = (line) => line.startsWith("Combo");

  const isMarkMaterialLine = (line) =>
    line.startsWith("Materials") || line.startsWith("High Quality Material");

  const parseLines = (note) => {
    const lines = note.split(/\r?\n/);
    return lines.filter((line) => line && !line.startsWith("_"));
  };

  const processCombo = (line, currentObject) => {
    let parts = line.startsWith("Combo::") ? line.split("::") : line.split(":");
    let addOnProduct = parts[1].trim().startsWith("Jersey")
      ? parts[1].replace("Jersey", "")
      : parts[1];

    if (currentObject.Type) {
      currentObject.Type += addOnProduct;
    } else if (currentObject.Style) {
      currentObject.Style += addOnProduct;
    }
  };

  const processKeyValueLine = (line, currentObject) => {
    let parts = line.includes("::") ? line.split("::") : line.split(":");
    parts = parts.filter((item) => item.trim() !== "");
    currentObject[parts[0].trim()] = parts[1].trim();
  };

  const handleProcessNotes = (previousData) => {
    let note = previousData["Notes"];
    if (!note) return [];

    const lines = parseLines(note);
    const result = [];
    let currentObject = {};

    lines.forEach((line) => {
      if (isMarkMaterialLine(line)) {
        console.log(line);
        line = null;
        return;
      }
      if (isTypeOrStyleLine(line)) {
        if (currentObject["Personal"]) {
          currentObject = {};
        }
        if (Object.keys(currentObject).length > 0) {
          result.push(currentObject);
        }
        currentObject = {};
      } else if (isSizeLine(line)) {
      } else if (isComboLine(line)) {
        processCombo(line, currentObject);
        return;
      } else if (isPersonalizationLine(line)) {
        if (currentObject["Personal"]) {
          currentObject = {};
        }
        const index = line.indexOf(":");
        line = [line.slice(0, index + 1), line.slice(index + 1)];
        // line = line.split(":");
        currentObject["Personal"] = line[1];

        if (!currentObject["Type"] && !currentObject["Style"]) {
          currentObject["Type"] = "";
          currentObject["Size"] = "";
        }
        if (Object.keys(currentObject).length > 0) {
          result.push(currentObject);
        }
        return;
      } else {
        currentObject["Personal"] =
          (currentObject["Personal"] || "") + "\r\n" + line;
        return;
      }

      processKeyValueLine(line, currentObject);
    });

    if (Object.keys(currentObject).length > 0) {
      result.push(currentObject);
    }
    return result;
  };

  return (
    <div className="p-4 space-y-4 uploader">
      <h1 className="text-xl font-bold">Tải file Shopify</h1>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />
    </div>
  );
}
