import React, { useState } from "react";
import * as XLSX from "xlsx";
import moment from "moment";
import "./App.css";

export default function ExcelConverter() {
  const [convertedData, setConvertedData] = useState([]);
  const [excelName, setExcelName] = useState("converted");
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setExcelName(file.name.replace(/\.(csv|xlsx)$/, ""));
    const reader = new FileReader();
    setConvertedData([]);
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

      setConvertedData(transformed);
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
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(convertedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, excelName);
    XLSX.writeFile(wb, excelName + "_converted.xlsx");
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

  const processPersonalization = (
    line,
    currentObject,
    currentPersonalization
  ) => {
    const parts = line.split(":");
    if (!currentPersonalization) {
      currentObject["Personal"] = parts[1];
    }

    if (!currentObject["Type"] && !currentObject["Style"]) {
      currentObject["Type"] = "";
      currentObject["Size"] = "";
    }

    return parts;
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
    let currentPersonalization = "";

    lines.forEach((line) => {
      if (isTypeOrStyleLine(line)) {
        currentPersonalization = "";
        if (Object.keys(currentObject).length > 0) {
          result.push(currentObject);
        }
        currentObject = {};
      } else if (isSizeLine(line)) {
        currentPersonalization = "";
      } else if (isComboLine(line)) {
        currentPersonalization = "";
        processCombo(line, currentObject);
        return;
      } else if (isPersonalizationLine(line)) {
        currentPersonalization = processPersonalization(
          line,
          currentObject,
          currentPersonalization
        );
        if (Object.keys(currentObject).length > 0) {
          result.push(currentObject);
        }
        return;
      } else {
        currentObject["Personal"] = (currentObject["Personal"] || "") + line;
        if (!currentObject["Type"] || !currentObject["Style"]) {
          currentObject["Type"] = "";
          currentObject["Size"] = "";
          if (Object.keys(currentObject).length > 0) {
            result.push(currentObject);
          }
        }
        return;
      }

      processKeyValueLine(line, currentObject);
    });

    if (Object.keys(currentObject).length > 0) {
      result.push(currentObject);
    }

    console.log(previousData["Name"]);
    console.log(result);
    return result;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Tycheco Excel Converter</h1>
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />

      {convertedData.length > 0 && (
        <>
          <div>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleExport}
            >
              Tải file đã xử lý
            </button>
          </div>
          <table className="w-full table-auto border">
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
          </table>
        </>
      )}
    </div>
  );
}
