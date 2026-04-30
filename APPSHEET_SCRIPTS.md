
## Print Weekly Schedule

```gs
function emailSchedule() {
  // 1. Open the main spreadsheet
  var outputSheet      = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  var printTriggerSheet = outputSheet.getSheetByName("hr_print_sched");
  var printTriggerData = printTriggerSheet.getDataRange().getValues();

  var scheduleType   = printTriggerData[printTriggerData.length - 1][0];
  var emailAddress   = printTriggerData[printTriggerData.length - 1][1];

  var subject = scheduleType + " Schedules " + Utilities.formatDate(new Date(), "Pacific/Honolulu", "yyyy-MM-dd HH:mm");
  var body =
    "Hello,\n\n" +
    "Please find the " + scheduleType + "'s Schedule PDFs attached:\n" +
    "1) Cuke GH schedule\n" +
    "2) Cuke PH schedule\n" +
    "3) Lettuce GH/PH schedule\n" +
    "4) Full schedule\n\n" +
    "Best regards,\n" +
    "Michael";

  var ghSchedSheet      = outputSheet.getSheetByName("print_cuke_gh_sched");       // GH-only
  var phSchedSheet      = outputSheet.getSheetByName("print_cuke_ph_sched");       // PH-only
  var lettuceShedSheet     = outputSheet.getSheetByName("print_lettuce_sched");    // Lettuce-only
  var fullShedSheet     = outputSheet.getSheetByName("print_full_sched");    // Full-only

  var ghPdfBlob   = getPdfBlob(outputSheet.getId(), ghSchedSheet.getSheetId(),     "Cuke_GH_tasks.pdf");
  var phPdfBlob   = getPdfBlob(outputSheet.getId(), phSchedSheet.getSheetId(),     "Cuke_PH_tasks.pdf");
  var lettucePdfBlob  = getPdfBlob(outputSheet.getId(), lettuceShedSheet.getSheetId(),    "Lettuce_all_tasks.pdf");
  var fullPdfBlob  = getPdfBlob(outputSheet.getId(), fullShedSheet.getSheetId(),    "Full_Schedule.pdf");

  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    body: body,
    attachments: [ghPdfBlob, phPdfBlob, lettucePdfBlob, fullPdfBlob ]
  });


  Utilities.sleep(5000); 
  printTriggerSheet.getRange(2, 1, printTriggerSheet.getLastRow() - 1, printTriggerSheet.getLastColumn()).clearContent();
}

function getPdfBlob(spreadsheetId, sheetId, pdfFilename) {
  // Build the export URL
  var exportUrl = "https://docs.google.com/spreadsheets/d/" 
    + spreadsheetId 
    + "/export?format=pdf"
    + "&gid=" + sheetId

    + "&size=A4"
    + "&portrait=false"
    + "&fitw=true"
    + "&sheetnames=false"
    + "&printtitle=false"
    + "&pagenum=UNDEFINED"
    + "&gridlines=true";

  var response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    }
  });

  return response.getBlob().setName(pdfFilename);
}
```

## Run Payroll

```gs
function runPayroll() {
  // --- CONFIG ---
  var hrbFolder = DriveApp.getFolderById("1ALCDDV5ob1MsmwO-YB1nVtauua2jSS17");
  var inputSheet  = SpreadsheetApp.openById("1HLX11I82ADv_ypFztMIMTF4xw6axcGUVTLkxV_CcTo0");
  var outputSheet = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");

  var payrollTab   = outputSheet.getSheetByName("hr_ee_payroll");
  var registerTab  = outputSheet.getSheetByName("hr_ee_register").getDataRange().getValues();
  var dollarData   = inputSheet.getSheetByName("$data").getDataRange().getValues();
  var netPayData   = inputSheet.getSheetByName("NetPay").getDataRange().getValues();
  var hoursData    = inputSheet.getSheetByName("Hours").getDataRange().getValues();
  var ptoBankData  = inputSheet.getSheetByName("PTOBank").getDataRange().getValues();
  var wcData       = inputSheet.getSheetByName("WC").getDataRange().getValues();
  var tdiData      = inputSheet.getSheetByName("TDI").getDataRange().getValues();

  // Build a map from "Employee Name" (which embeds ID) using a regex
  function mapFromNameWithId(arr, regex){
    return toMap(arr, function(r){
      var txt = r["Employee Name"] || "";
      var m = txt.match(regex);
      return m ? normId(m[1]) : "";
    });
  }

  // --- SHAPE THE DATA WE NEED ---
  var register = extractColumns(registerTab, [
    "employee_id","FullName","Department","Status","CompensationManager","PayStructure","IsManager","OvertimeThreshold"
  ]);

  var dollar = extractColumns(dollarData, [
    "Full Name","Emp ID","Pay Period","Check Date","Inv No","Gross Wages","Labor Fees","Other Tax",
    "Workers Comp","Health Benefits","Oth Health Chgs","Admin Fees","Hawaii GET","Other Charges","Total Cost","Hours"
  ]);

  var netPay = extractColumns(netPayData, [
    "Employee Name","Hourly Rate","Auto Allowances","Hourly","Bonus", "Overtime","PTO","Salary",
    "Per Diem","Comp Plus","HDS Dental","PreTax 401K","FIT","SIT","Social Security",
    "Medicare","Auto Deduction","Child Support","Program Fees","Net Pay"
  ]);

  var hours = extractColumns(hoursData, [
    "EMPID","Check Date","Regular Hours","Overtime Hours","PTO Hours","Total Hours","Regular Pay","Overtime Pay","PTO Pay","Other Pay","Total Pay"
  ]);

  var ptoBank = extractColumns(ptoBankData, ["Employee Name","Net YTD Hours Accrued"]);
  var tdi     = extractColumns(tdiData,     ["Employee Name","Employer TDI"]);
  var wc      = extractColumns(wcData,      ["Employee Name","WC 0008","WC 8810","WC 8742"]);

  // --- INDEXES / LOOKUPS (all keys normalized once) ---
  var registerMap = toMap(register, function(r){ return normId(r["employee_id"]); });

  var hoursMap = toMap(hours, function(r){
    var id  = normId(r["EMPID"]);
    var day = isoDate(r["Check Date"]);
    return id ? (id + "_" + day) : "";
  });

  var netPayMap = mapFromNameWithId(netPay, /-(\d+)\s*$/);
  var ptoMap    = mapFromNameWithId(ptoBank, /EMPLOYEE:\s*(\d+)\s*-/i);
  var tdiMap    = mapFromNameWithId(tdi, /^(\d+)\s*-/);
  var wcMap     = mapFromNameWithId(wc,  /^(\d+)\s*-/);

  // --- VALIDATE "MISSING EMPLOYEES" (using normalized ids) ---
  var missing = [];
  var seen = new Set();
  dollar.forEach(function(d){
    var id = normId(d["Emp ID"]);
    if (!id) return;
    if (!registerMap[id] && !seen.has(id)){
      missing.push((d["Full Name"] || "Unknown") + " (" + id + ")");
      seen.add(id);
    }
  });
  if (missing.length){
    return "The following employee(s) are listed in the HRB payroll but are missing Employee ID's in the register: " + missing.join(", ");
  }

  // --- PROCESS ---
  var invPivot = invSummary(dollar);
  var merged = [];

  dollar.forEach(function(d){
    var invNo  = d["Inv No"];
    var empId  = normId(d["Emp ID"]);
    var regRow = registerMap[empId] || {};

    var checkDate = new Date(d["Check Date"]);
    var checkKey  = empId + "_" + isoDate(checkDate);
    var hrRow     = hoursMap[checkKey] || {};
    var netRow    = netPayMap[empId] || {};
    var ptoRow    = ptoMap[empId] || {};
    var tdiRow    = tdiMap[empId] || {};
    var wcRow     = wcMap[empId]  || {};

    // WC code + amount
    var wcCode = "", wcAmount = 0;
    ["WC 0008","WC 8810","WC 8742"].some(function(col){
      var val = parseFloat(wcRow[col]) || 0;
      if (val > 0){ wcCode = "'" + col.replace("WC ",""); wcAmount = val; return true; }
      return false;
    });

    // Dates math
    var parts = String(d["Pay Period"]).split(" - ");
    var startDate = new Date(parts[0]);
    var endDate   = new Date(parts[1]);
    var startOfYear = new Date(checkDate.getFullYear(), 0, 1);

    var totalHours = hrRow["Total Hours"] || 0;
    var overtimeThreshold = parseFloat(regRow["OvertimeThreshold"]) || 0;
    var overtimeHours = hrRow["Overtime Hours"] || 0;
    var overtimePay   = hrRow["Overtime Pay"] || 0;
    var totalCost     = d["Total Cost"] || 0;

    var totalDays = Math.floor((endDate - startDate)/(24*3600*1000)) + 1;
    var sameMonth = (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth());
    var d1 = sameMonth ? totalDays :
      Math.floor((new Date(startDate.getFullYear(), startDate.getMonth()+1, 0) - startDate)/(24*3600*1000)) + 1;
    var d2 = totalDays - d1;

    var discretionaryOT = Math.max(totalHours - overtimeThreshold, 0);
    var h1 = Number((totalHours * d1 / (d1 + d2)).toFixed(2));
    var h2 = Number((totalHours - h1).toFixed(2));
    var t1 = Number((totalCost * d1 / (d1 + d2)).toFixed(2));
    var t2 = Number((totalCost - t1).toFixed(2));

    merged.push([
      d["Full Name"] || "ADJUSTMENT",             // full_name
      empId,                                      // employee_id (normalized)
      d["Pay Period"],                            // pay_period
      d["Check Date"],                            // check_date
      ((invPivot[invNo] || 0) > 5000) ? "true":"false", // is_standard
      invNo,                                      // invoice_number
      regRow["IsManager"] || "false",             // is_manager
      regRow["Department"] || "",                 // department
      regRow["Status"] || "",                     // status
      wcCode,                                     // workers_compensation_code
      regRow["CompensationManager"] || "",        // compensation_manager
      regRow["PayStructure"] || "",               // pay_structure
      "HRB",                                      // source
      netRow["Hourly Rate"] || 0,                 // hourly_rate

      hrRow["Regular Hours"] || 0,                // regular_hours
      overtimeHours,                              // overtime_hours
      hrRow["PTO Hours"] || 0,                    // pto_hours_taken
      totalHours,                                 // total_hours
      ptoRow["Net YTD Hours Accrued"] || 0,       // pto_hours_accrued
      overtimeThreshold,                          // overtime_threashold
      discretionaryOT,                            // discretionary_overtime_hours
      hrRow["Regular Pay"] || 0,                  // regular_pay
      overtimePay,                                // overtime_pay
      parseFloat(((discretionaryOT / (overtimeHours || 1)) * overtimePay).toFixed(2)), // discretionary_overtime_pay
      hrRow["PTO Pay"] || 0,                      // pto_pay
      netRow["Auto Allowances"] || 0,             // auto_allowances
      netRow["Per Diem"] || 0,                    // per_diem
      hrRow["Other Pay"] || 0,                    // other_pay
      netRow["Bonus"] || 0,                       // bonus_pay

      d["Gross Wages"] || 0,                      // gross_wage
      d["Labor Fees"] || 0,                       // labor_tax
      d["Other Tax"] || 0,                        // other_tax
      d["Workers Comp"] || 0,                     // workers_compensation
      d["Health Benefits"] || 0,                  // health_benefits
      d["Oth Health Chgs"] || 0,                  // other_health_charges
      d["Admin Fees"] || 0,                       // admin_fees
      d["Hawaii GET"] || 0,                       // hawaii_get
      d["Other Charges"] || 0,                    // other_charges
      totalCost,                                  // total_cost

      wcAmount,                                   // workers_compensation_amount
      tdiRow["Employer TDI"] || 0,                // tdi

      netRow["FIT"] || 0,                         // fit
      netRow["SIT"] || 0,                         // sit
      netRow["Social Security"] || 0,             // social_security
      netRow["Medicare"] || 0,                    // medicare
      netRow["Comp Plus"] || 0,                   // comp_plus
      netRow["HDS Dental"] || 0,                  // hds_dental
      netRow["PreTax 401K"] || 0,                 // pre_tax_401k
      (parseFloat(netRow["Comp Plus"]) || 0) + (parseFloat(netRow["HDS Dental"]) || 0) + (parseFloat(netRow["PreTax 401K"]) || 0), // deductions_01
      netRow["Auto Deduction"] || 0,              // auto_deduction
      netRow["Child Support"] || 0,               // child_support
      netRow["Program Fees"] || 0,                // program_fees
      (parseFloat(netRow["Auto Deduction"]) || 0) + (parseFloat(netRow["Child Support"]) || 0) + (parseFloat(netRow["Program Fees"]) || 0), // deductions_02
      netRow["Net Pay"] || 0,                     // net_pay




      Math.ceil((((checkDate - startOfYear)/(24*60*60*1000) + startOfYear.getDay() + 1)/7)/2), // pay_period_number
      checkDate.getFullYear(),                    // year
      checkDate.getMonth() + 1,                   // month
      startDate.getFullYear(),                    // y1
      endDate.getFullYear(),                      // y2
      startDate.getMonth() + 1,                   // m1
      endDate.getMonth() + 1,                     // m2
      d1, d2, h1, h2, t1, t2,
      generateUniqueId(),                         // entry_id
      Utilities.formatDate(new Date(), "Pacific/Honolulu", "yyyy-MM-dd HH:mm:ss") // updated_date_time
    ]);
  });

  // Write rows
  if (merged.length){
    payrollTab.getRange(payrollTab.getLastRow() + 1, 1, merged.length, merged[0].length).setValues(merged);
  }

  // Backup source file
  var maxCheckDate = Utilities.formatDate(
    new Date(Math.max.apply(null, dollar.map(function(r){ return new Date(r["Check Date"]).setHours(0,0,0,0); }))),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
  var newFileName = maxCheckDate + "_processed_" + Utilities.formatDate(new Date(), "Pacific/Honolulu","yyyy-MM-dd HH:mm:ss");
  DriveApp.getFileById(inputSheet.getId()).makeCopy(newFileName, hrbFolder);

  // Clear inputs for next run
  ["$data","NetPay","Hours","PTOBank","WC","TDI"].forEach(function(name){
    var s = inputSheet.getSheetByName(name);
    if (!s) return;
    var last = s.getLastRow();
    if (last > 1) s.getRange(2,1,last-1,s.getLastColumn()).clearContent();
  });

  payrollSchedComparison();
  return "Payroll processed successfully";
}

// --- HELPER FUNCTIONS ---
function normId(v) {
  return String(v == null ? "" : v).replace(/\D/g,"").trim();
}

function isoDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

function extractColumns(data, headers) {
  var idx = (data[0] || []).reduce(function(m, c, i){
    m[String(c).trim()] = i;
    return m;
  }, {});
  return data.slice(1).map(function(row){
    var o = {};
    headers.forEach(function(h){ o[h] = row[idx[h]]; });
    return o;
  });
}

function toMap(arr, keyFn) {
  var m = {};
  arr.forEach(function(r){
    var k = keyFn(r);
    if (k) m[k] = r;
  });
  return m;
}

function invSummary(data) {
  var invGrouped = {};
  data.forEach(function(row) {
    var invNo = row["Inv No"];
    var hours = parseFloat(row["Hours"]) || 0;
    invGrouped[invNo] = (invGrouped[invNo] || 0) + hours;
  });
  return invGrouped;
}

function generateUniqueId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = '';
  for (var i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
```

## Upate Daily Schedule

```gs
function updateDailySched() {
  var outputSheet = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  var dailySchedTab = outputSheet.getSheetByName("hr_ee_sched_daily"); 
  var allData = dailySchedTab.getDataRange().getValues();
  var allDataDisplay = dailySchedTab.getDataRange().getDisplayValues();
  
  if (allData.length <= 1) return;
  
  var headers = allData[0];
  var timezone = "Pacific/Honolulu";
  
  // Find column indices once
  var colMap = {};
  headers.forEach(function(header, idx) {
    colMap[header] = idx;
  });

  var dateCol = colMap["Date"];
  var weekStartCol = colMap["WeekStartDate"];
  var yearCol = colMap["Year"];
  var weekCol = colMap["Week"];
  var dayOfWeekCol = colMap["DayofWeek"];
  var entryIdCol = colMap["EntryID"];
  var updatedDateTimeCol = colMap["UpdatedDateTime"];

  // Calculate current week based on TODAY in Honolulu timezone
  var todayInHonolulu = new Date(Utilities.formatDate(new Date(), timezone, "MMM dd, yyyy HH:mm:ss"));
  var dayOfWeekToday = todayInHonolulu.getDay();
  
  var thisSunday = new Date(todayInHonolulu);
  thisSunday.setDate(todayInHonolulu.getDate() - dayOfWeekToday);
  thisSunday.setHours(0, 0, 0, 0);

  var nextSunday = new Date(thisSunday);
  nextSunday.setDate(thisSunday.getDate() + 7);
  nextSunday.setHours(0, 0, 0, 0);

  var nextWeekStartStr = Utilities.formatDate(nextSunday, timezone, "EEE MMM dd yyyy");
  var currentDateTime = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd HH:mm:ss");
  
  var thisWeekStartDisplay = Utilities.formatDate(thisSunday, timezone, "M/d/yyyy");
  var nextWeekStartDisplay = Utilities.formatDate(nextSunday, timezone, "M/d/yyyy");
  
  var keepRows = [headers];
  var rowsToCopy = [];
  var deletedCount = 0;

  // First pass: Delete next week rows and collect current week rows to copy
  for (var i = 1; i < allData.length; i++) {
    var row = allData[i];
    var rowWeekStartDisplay = allDataDisplay[i][weekStartCol];
    
    if (!rowWeekStartDisplay) {
      keepRows.push(row);
      continue;
    }
    
    // If this row's WeekStartDate is next week, DELETE it
    if (rowWeekStartDisplay === nextWeekStartDisplay) {
      deletedCount++;
      continue;
    }
    
    // Keep this row
    keepRows.push(row);
    
    // If this row's WeekStartDate is current week, mark it to be copied
    if (rowWeekStartDisplay === thisWeekStartDisplay) {
      rowsToCopy.push({row: row, index: i});
    }
  }

  // Second pass: Create copies for next week
  var newRows = [];
  for (var j = 0; j < rowsToCopy.length; j++) {
    var rowData = rowsToCopy[j];
    var row = rowData.row;
    var rowIndex = rowData.index;
    
    var rowDateDisplay = allDataDisplay[rowIndex][dateCol]; // Get display value like "2/8/2026"
    
    // Parse the display date (M/d/yyyy format)
    var dateParts = rowDateDisplay.split('/');
    var month = parseInt(dateParts[0]);
    var day = parseInt(dateParts[1]);
    var year = parseInt(dateParts[2]);
    
    // Add 7 days
    var newDate = new Date(year, month - 1, day + 7);
    
    var startOfYear = new Date(newDate.getFullYear(), 0, 1);
    var newWeek = Math.ceil(((newDate - startOfYear) / (24 * 60 * 60 * 1000) + startOfYear.getDay() + 1) / 7);
    
    var newDateDay = newDate.getDay();
    
    // Clone the row and update specific fields
    var newRow = row.slice();
    newRow[weekStartCol] = nextWeekStartStr;
    newRow[dateCol] = newDate;
    newRow[yearCol] = newDate.getFullYear();
    newRow[weekCol] = newWeek;
    newRow[dayOfWeekCol] = newDateDay + 1;
    newRow[entryIdCol] = generateUniqueId();
    newRow[updatedDateTimeCol] = currentDateTime;
    
    newRows.push(newRow);
  }

  // Combine kept rows with new rows
  var finalData = keepRows.concat(newRows);

  // Clear and write all data in ONE operation
  dailySchedTab.clear();
  if (finalData.length > 0) {
    dailySchedTab.getRange(1, 1, finalData.length, finalData[0].length).setValues(finalData);
  }

  updateWeekSched();
}
```

## Update Weekly Schedule

```gs
function updateWeekSched() {
  var outputSheet = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  var dailySchedTab = outputSheet.getSheetByName("hr_ee_sched_daily");
  var weekSchedTab = outputSheet.getSheetByName("hr_ee_sched_weekly");

  // Get daily schedule data
  var dataRange = dailySchedTab.getDataRange();
  var dailySchedData = dataRange.getValues();
  var dailySchedDisplay = dataRange.getDisplayValues();
  var headers = dailySchedData[0];

  // Build column index map
  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[headers[i]] = i;
  }

  // Get column indices
  var weekCol = colMap["WeekStartDate"];
  var empIdCol = colMap["employee_id"];
  var empCol = colMap["FullName"];
  var deptCol = colMap["Department"];
  var statCol = colMap["Status"];
  var taskCol = colMap["Task"];
  var dateCol = colMap["Date"];
  var startTimeCol = colMap["StartTime"];
  var endTimeCol = colMap["EndTime"];
  var hoursCol = colMap["Hours"];

  // Cache values
  var currentYear = new Date().getFullYear();
  var startOfYear = new Date(currentYear, 0, 1);
  var startOfYearTime = startOfYear.getTime();
  var startOfYearDay = startOfYear.getDay();
  var currentDateTime = Utilities.formatDate(new Date(), "Pacific/Honolulu", "yyyy-MM-dd HH:mm:ss");

  var groupedData = {};
  var groupKeys = [];

  // Process and group data
  for (var index = 1; index < dailySchedData.length; index++) {
    var dataRow = dailySchedData[index];
    var displayRow = dailySchedDisplay[index];
    
    var week = dataRow[weekCol];
    var empId = dataRow[empIdCol] || "";
    var emp = dataRow[empCol];
    var dept = dataRow[deptCol];
    var stat = dataRow[statCol];
    var task = dataRow[taskCol];
    var dateStr = displayRow[dateCol];
    var startTime = displayRow[startTimeCol];
    var endTime = displayRow[endTimeCol];
    var hours = parseFloat(dataRow[hoursCol]) || 0;

    if (!week || !emp || !dept || !stat || !task || !dateStr) continue;

    var dateParts = dateStr.split("/");
    if (dateParts.length < 3) continue;
    var dayIndex = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]).getDay();

    var timeRange = "";
    if (startTime || endTime) {
      var startTimeStr = startTime ? startTime.split(":").slice(0, 2).join(":") : "";
      var endTimeStr = endTime ? endTime.split(":").slice(0, 2).join(":") : "";
      timeRange = startTimeStr + " - " + endTimeStr;
    }

    var key = week + "||" + empId + "||" + emp + "||" + dept + "||" + stat + "||" + task;

    if (!groupedData[key]) {
      groupedData[key] = {
        week: week,
        empId: empId,
        emp: emp,
        dept: dept,
        stat: stat,
        task: task,
        days: ["", "", "", "", "", "", ""],
        totalHours: 0
      };
      groupKeys.push(key);
    }

    if (timeRange) {
      groupedData[key].days[dayIndex] = groupedData[key].days[dayIndex] 
        ? groupedData[key].days[dayIndex] + "," + timeRange 
        : timeRange;
    }
    groupedData[key].totalHours += hours;
  }

  // Build output array
  var allWeeksData = [];
  for (var i = 0; i < groupKeys.length; i++) {
    var group = groupedData[groupKeys[i]];
    var weekDate = new Date(group.week);
    var weekNumber = Math.ceil(((weekDate.getTime() - startOfYearTime) / 86400000 + startOfYearDay + 1) / 7);
    
    allWeeksData.push([
      group.week,
      group.emp,
      group.empId,
      group.dept,
      group.stat,
      group.task,
      group.days[0],
      group.days[1],
      group.days[2],
      group.days[3],
      group.days[4],
      group.days[5],
      group.days[6],
      group.totalHours,
      weekNumber,
      currentYear,
      generateUniqueId(),
      currentDateTime
    ]);
  }

  // Clear and write in one operation
  if (allWeeksData.length > 0) {
    var lastRow = weekSchedTab.getLastRow();
    if (lastRow > 1) {
      weekSchedTab.getRange(2, 1, lastRow - 1, weekSchedTab.getLastColumn()).clearContent();
    }
    weekSchedTab.getRange(2, 1, allWeeksData.length, allWeeksData[0].length).setValues(allWeeksData);
    
    //updateWeekSchedSummary();
  } else if (weekSchedTab.getLastRow() > 1) {
    weekSchedTab.getRange(2, 1, weekSchedTab.getLastRow() - 1, weekSchedTab.getLastColumn()).clearContent();
  }
}

```

## Update Weekly Schedule Summary

```gs
function updateWeekSchedSummary() { 
  var outputSheet = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  var dailySchedTab = outputSheet.getSheetByName("hr_ee_sched_daily");
  var weekSchedTaskTab = outputSheet.getSheetByName("hr_ee_sched_weekly_tasks");

  // Get daily schedule data
  var dailySchedData = dailySchedTab.getDataRange().getValues();
  var headers = dailySchedData[0];
  
  // Build column map
  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[headers[i]] = i;
  }
  
  var weekCol = colMap["WeekStartDate"];
  var empCol = colMap["FullName"];
  var taskCol = colMap["Task"];
  var dateCol = colMap["Date"];
  var hoursCol = colMap["Hours"];

  // Cache values
  var startOfYear = new Date(new Date().getFullYear(), 0, 1);
  var startOfYearTime = startOfYear.getTime();
  var startOfYearDay = startOfYear.getDay();
  var currentYear = startOfYear.getFullYear();
  var currentDateTime = Utilities.formatDate(new Date(), "Pacific/Honolulu", "yyyy-MM-dd HH:mm:ss");
  
  var groupedData = {};
  var groupKeys = [];

  // Process and group data
  for (var index = 1; index < dailySchedData.length; index++) {
    var row = dailySchedData[index];

    var week = row[weekCol];
    var task = row[taskCol];
    var date = row[dateCol];
    var hours = parseFloat(row[hoursCol]) || 0;
    var employee = row[empCol];

    if (!week || !task || !hours || !date || !(date instanceof Date)) continue;

    var key = week + "||" + task;
    var totalKey = week + "||Total";
    var dayIndex = date.getDay();

    // Initialize task group
    if (!groupedData[key]) {
      groupedData[key] = {
        week: week,
        task: task,
        uniqueEmployees: [{}, {}, {}, {}, {}, {}, {}],
        dailyHours: [0, 0, 0, 0, 0, 0, 0],
        totalHours: 0
      };
      groupKeys.push(key);
    }

    // Initialize total group
    if (!groupedData[totalKey]) {
      groupedData[totalKey] = {
        week: week,
        task: "Total",
        uniqueEmployees: [{}, {}, {}, {}, {}, {}, {}],
        dailyHours: [0, 0, 0, 0, 0, 0, 0],
        totalHours: 0
      };
      if (groupKeys.indexOf(totalKey) === -1) {
        groupKeys.push(totalKey);
      }
    }

    // Track unique employees
    groupedData[key].uniqueEmployees[dayIndex][employee] = true;
    groupedData[key].dailyHours[dayIndex] += hours;
    groupedData[key].totalHours += hours;

    groupedData[totalKey].uniqueEmployees[dayIndex][employee] = true;
    groupedData[totalKey].dailyHours[dayIndex] += hours;
    groupedData[totalKey].totalHours += hours;
  }

  // Build output array
  var allWeeksData = [];
  
  for (var i = 0; i < groupKeys.length; i++) {
    var group = groupedData[groupKeys[i]];
    var weekDate = new Date(group.week);
    var weekNumber = Math.ceil(((weekDate.getTime() - startOfYearTime) / 86400000 + startOfYearDay + 1) / 7);
    
    // Count unique employees
    var emp0 = Object.keys(group.uniqueEmployees[0]).length;
    var emp1 = Object.keys(group.uniqueEmployees[1]).length;
    var emp2 = Object.keys(group.uniqueEmployees[2]).length;
    var emp3 = Object.keys(group.uniqueEmployees[3]).length;
    var emp4 = Object.keys(group.uniqueEmployees[4]).length;
    var emp5 = Object.keys(group.uniqueEmployees[5]).length;
    var emp6 = Object.keys(group.uniqueEmployees[6]).length;
    
    allWeeksData.push([
      group.week,
      group.task,
      emp0, group.dailyHours[0],
      emp1, group.dailyHours[1],
      emp2, group.dailyHours[2],
      emp3, group.dailyHours[3],
      emp4, group.dailyHours[4],
      emp5, group.dailyHours[5],
      emp6, group.dailyHours[6],
      group.totalHours,
      weekNumber,
      currentYear,
      generateUniqueId(),
      currentDateTime
    ]);
  }

  // Clear and write in one operation
  if (allWeeksData.length > 0) {
    var lastRow = weekSchedTaskTab.getLastRow();
    if (lastRow > 1) {
      weekSchedTaskTab.getRange(2, 1, lastRow - 1, weekSchedTaskTab.getLastColumn()).clearContent();
    }
    weekSchedTaskTab.getRange(2, 1, allWeeksData.length, allWeeksData[0].length).setValues(allWeeksData);
  } else if (weekSchedTaskTab.getLastRow() > 1) {
    weekSchedTaskTab.getRange(2, 1, weekSchedTaskTab.getLastRow() - 1, weekSchedTaskTab.getLastColumn()).clearContent();
  }
}

```

## Payroll Comparison

```gs
// Main Function
function payrollSchedComparison() {
  const ss = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  const payrollSheet = ss.getSheetByName("hr_ee_payroll");

  const columns = [
    "employee_id", "full_name", "pay_period", "check_date", "is_manager", "department", "status",
    "compensation_manager", "workers_compensation_code",
    "total_hours","regular_hours", "pto_hours_taken", "discretionary_overtime_hours",
    "total_cost", "regular_pay", "overtime_pay", "discretionary_overtime_pay"
  ];

  // Uses your existing extractColumns(...)
  const payrollData = extractColumns(payrollSheet.getDataRange().getValues(), columns);

  // Filter all records where CheckDate is greater 2025 and PayPeriod is not empty
  const filteredPayroll = payrollData.filter(function(row) {
    const checkDate = new Date(row["check_date"]);
    return row["pay_period"] && checkDate.getFullYear() >= 2025;
  });

  // GROUP BY full_name and check_date
  const groupedPayroll = {};
  filteredPayroll.forEach(function(row) {
    const groupKey = row["full_name"] + "|" + row["check_date"].toString();
    
    if (!groupedPayroll[groupKey]) {
      groupedPayroll[groupKey] = {
        employee_id: row["employee_id"],
        full_name: row["full_name"],
        pay_period: row["pay_period"],
        check_date: row["check_date"],
        is_manager: row["is_manager"],
        department: row["department"],
        status: row["status"],
        compensation_manager: row["compensation_manager"],
        workers_compensation_code: row["workers_compensation_code"],
        total_hours: 0,
        regular_hours: 0,
        pto_hours_taken: 0,
        discretionary_overtime_hours: 0,
        total_cost: 0,
        regular_pay: 0,
        overtime_pay: 0,
        discretionary_overtime_pay: 0
      };
    }
    
    groupedPayroll[groupKey].total_hours += parseFloat(row["total_hours"]) || 0;
    groupedPayroll[groupKey].regular_hours += parseFloat(row["regular_hours"]) || 0;
    groupedPayroll[groupKey].pto_hours_taken += parseFloat(row["pto_hours_taken"]) || 0;
    groupedPayroll[groupKey].discretionary_overtime_hours += parseFloat(row["discretionary_overtime_hours"]) || 0;
    groupedPayroll[groupKey].total_cost += parseFloat(row["total_cost"]) || 0;
    groupedPayroll[groupKey].regular_pay += parseFloat(row["regular_pay"]) || 0;
    groupedPayroll[groupKey].overtime_pay += parseFloat(row["overtime_pay"]) || 0;
    groupedPayroll[groupKey].discretionary_overtime_pay += parseFloat(row["discretionary_overtime_pay"]) || 0;
  });

  // Convert to array
  const consolidatedPayroll = Object.keys(groupedPayroll).map(function(key) {
    return groupedPayroll[key];
  });

  // Load full schedule data (unfiltered)
  const scheduleSheet = ss.getSheetByName("hr_ee_sched_weekly");
  const scheduleData = extractColumns(scheduleSheet.getDataRange().getDisplayValues(), [
    "WeekStartDate", "employee_id", "FullName", "Department", "Task", "TotalHours"
  ]);

  // Load tasks and create account map
  const taskSheet = ss.getSheetByName("hr_ee_tasks");
  const taskData = extractColumns(taskSheet.getDataRange().getValues(), ["Task", "QuickBooksAccount"]);
  const taskMap = {};
  taskData.forEach(function(row) {
    taskMap[row["Task"]] = row["QuickBooksAccount"] || null;
  });

  // PRE-PROCESS: Build schedule lookup map by normalized employee_id and date code
  const scheduleMap = {};
  scheduleData.forEach(function(s) {
    const empName = normName(s["FullName"]);
    if (!empName) return;

    const weekCode = formattedDateCode(s["WeekStartDate"]);
    const hours = parseFloat(s["TotalHours"]) || 0;

    if (!scheduleMap[empName]) scheduleMap[empName] = [];
    scheduleMap[empName].push({
      weekCode: weekCode,
      task: s["Task"],
      hours: hours,
      department: s["Department"]
    });
  });

  const output = [];

  consolidatedPayroll.forEach(function(p) {
    const payrollTotalHours       = parseFloat(p["total_hours"]) || 0;
    const payrollRegularHours = parseFloat(p["regular_hours"]) || 0;
    const payrollPTOHours    = parseFloat(p["pto_hours_taken"]) || 0;
    const payrollCost        = parseFloat(p["total_cost"]) || 0;
    const payrollRegular     = parseFloat(p["regular_pay"]) || 0;
    const payrollDTOPay      = parseFloat(p["discretionary_overtime_pay"]) || 0;
    const payrollDTOHours    = parseFloat(p["discretionary_overtime_hours"]) || 0;

    const payPeriod = p["pay_period"];
    if (!payPeriod || !payPeriod.includes(" - ")) return;

    const parts = payPeriod.split(" - ");
    const payStartCode = formattedDateCode(parts[0].trim());
    const payEndCode   = formattedDateCode(parts[1].trim());

    // Lookup employee schedule using NORMALIZED employee_id
    const empName = normName(p["full_name"]);
    const empScheduleRaw = scheduleMap[empName] || [];

    // Filter by date range
    const empSchedule = empScheduleRaw.filter(function(s) {
      return s.weekCode >= payStartCode && s.weekCode <= payEndCode;
    });

    // If no schedule found, push one row bucketed to WC code/department
    if (empSchedule.length === 0) {
      output.push([
        p["check_date"],
        p["full_name"],
        p["is_manager"],
        p["compensation_manager"],
        p["status"],
        "'" + (p["workers_compensation_code"] || ""),
        p["department"],
        0,  // scheduled_hours (none found)
        round(payrollTotalHours),
        round(payrollRegularHours),
        round(payrollDTOHours),
        round(payrollCost),
        round(payrollRegular),
        round(payrollDTOPay)
      ]);
      return;
    }

    // Aggregate hours by account (task -> QB account; fallback to department)
    const hoursByAcct = {};
    empSchedule.forEach(function(s) {
      const acct = (taskMap[s.task] || "").trim() || p["department"];
      if (!hoursByAcct[acct]) hoursByAcct[acct] = 0;
      hoursByAcct[acct] += s.hours;
    });

    // CAPTURE ORIGINAL SCHEDULED HOURS before scaling
    const originalScheduledHours = {};
    Object.keys(hoursByAcct).forEach(function(acct) {
      originalScheduledHours[acct] = hoursByAcct[acct];
    });

    // Normalize if totals differ
    const schedTotal = Object.keys(hoursByAcct).reduce(function(sum, k){ return sum + hoursByAcct[k]; }, 0);
    const scale = payrollTotalHours > 0 ? payrollTotalHours / schedTotal : 1;
    if (schedTotal > 0 && scale !== 1) {
      Object.keys(hoursByAcct).forEach(function(acct) {
        hoursByAcct[acct] *= scale;
      });
    }

    // Pre-calc
    const costPerHour  = payrollTotalHours > 0 ? payrollCost / payrollTotalHours : 0;
    const hoursDivisor = payrollTotalHours > 0 ? payrollTotalHours : 1;

    // Split rows by account
    Object.keys(hoursByAcct).forEach(function(acct) {
      if (payrollCost === 0) return;

      // Calculate ratio from UNROUNDED hours
      const ratio = hoursByAcct[acct] / hoursDivisor;

      // Apply ratio and round final values
      const taskHours = payrollTotalHours <= 0 && payrollPTOHours <= 0 ? 0
        : payrollTotalHours <= 0 && payrollPTOHours > 0 ? round(payrollPTOHours)
        : round(hoursByAcct[acct]);

      const taskCost = payrollTotalHours > 0 ? round(hoursByAcct[acct] * costPerHour) : round(payrollCost);
      const regHours = round(payrollRegularHours * ratio);
      const dtoHours = round(payrollDTOHours * ratio);
      const regPay   = round(payrollRegular * ratio);
      const dtoPay   = round(payrollDTOPay * ratio);

      output.push([
        p["check_date"],
        p["full_name"],
        p["is_manager"],
        p["compensation_manager"],
        p["status"],
        "'" + (p["workers_compensation_code"] || ""),
        acct,
        round(originalScheduledHours[acct]),  // scheduled_hours (raw from schedule)
        taskHours,                             // total_hours (from payroll)
        regHours,
        dtoHours,
        taskCost,
        regPay,
        dtoPay
      ]);
    });
  });

  // Output to joined sheet
  const out = ss.getSheetByName("hr_ee_payroll_by_tasks");
  if (out) {
    const last = out.getLastRow();
    if (last > 1) out.getRange(2, 1, last - 1, out.getLastColumn()).clearContent();
    if (output.length > 0) out.getRange(2, 1, output.length, output[0].length).setValues(output);
  }
}

// Convert string or date to YYYYMMDD (unchanged)
function formattedDateCode(value) {
  if (typeof value === 'string') {
    const parts = value.split("/");
    const m = parseInt(parts[0], 10);
    const dStr = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const year = y < 100 ? 2000 + y : y;
    return year * 10000 + m * 100 + dStr;
  }
  if (value instanceof Date) {
    return value.getFullYear() * 10000 + (value.getMonth() + 1) * 100 + value.getDate();
  }
  return 0;
}

function round(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function normName(name) {
  return name
    ? name.toString().trim().toLowerCase().replace(/\s+/g, " ")
    : "";
}
```

## Create Review Data

```gs
function createReviewData() {
  // Only run in month 2 of each quarter (Feb, May, Aug, Nov)
  const today = new Date();
  const month = today.getMonth() + 1; // Convert to 1-12
  
  if (![2, 5, 8, 11].includes(month)) {
    return;
  }

  const outputSheet = SpreadsheetApp.openById("13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts");
  const registerTab = outputSheet.getSheetByName("hr_ee_register").getDataRange().getValues();  
  const quarterlyReviews = outputSheet.getSheetByName("hr_quarterly_review");
  const reviewTab = quarterlyReviews.getDataRange().getValues();

  // Extract columns from both sheets
  const register = extractColumns(registerTab, [
    "employee_id","FullName","Department","Status","TeamLead","StartDate","EndDate","IsActive"
  ]);

  const review = extractColumns(reviewTab, [ 
    "employee_id","full_name","start_date","end_date","department","status","team_lead","productivity_score","attendance_score","quality_score","engagement_score","average_score","notes","review_date","reviewed_by","year","quarter","is_locked","entry_id","entry_updated_at"
  ]);

  // Get current quarter and date boundaries
  const current = getCurrentQuarter();
  const quarterDates = getQuarterDates(current.year, current.quarter);
  
  // Calculate next quarter (1 quarter out from current quarter)
  const nextQuarter = getQuarterDates(
    current.quarter === 4 ? current.year + 1 : current.year,
    current.quarter === 4 ? 1 : current.quarter + 1
  );
  
  // Filter eligible employees from register
  const eligibleEmployees = register.filter(emp => {
    // Must be active - handle both boolean and string values
    if (emp.IsActive !== true && emp.IsActive !== "true") {
      return false;
    }
    
    // Must have a team lead assigned
    if (!emp.TeamLead || emp.TeamLead === "") {
      return false;
    }
    
    // Start date must be before quarter starts
    const startDate = new Date(emp.StartDate);
    if (startDate >= quarterDates.start) {
      return false;
    }
    
    // End date must be blank OR extend beyond the next quarter
    if (emp.EndDate && emp.EndDate !== "") {
      const endDate = new Date(emp.EndDate);
      if (endDate <= nextQuarter.end) {
        return false;
      }
    }
    
    return true;
  });
  
  // Check which employees already have a review for current quarter
  const existingReviews = new Set(
    review
      .filter(r => r.year === current.year && r.quarter === `Q${current.quarter}`)
      .map(r => normId(r.employee_id))
  );
  
  // Create new review rows for employees who don't have one yet
  const newRows = eligibleEmployees
    .filter(emp => !existingReviews.has(normId(emp.employee_id)))
    .map(emp => ({
      employee_id: normId(emp.employee_id),
      full_name: emp.FullName,
      start_date: emp.StartDate,
      end_date: emp.EndDate,
      department: emp.Department,
      status: emp.Status,
      team_lead: emp.TeamLead,
      productivity_score: "",
      attendance_score: "",
      quality_score: "",
      engagement_score: "",
      average_score: "",
      notes: "",
      review_date: "",
      reviewed_by: "",
      year: current.year,
      quarter: `Q${current.quarter}`,
      is_locked: false,
      entry_id: generateUniqueId(),
      entry_updated_at: new Date()
    }));
  
  // Convert objects to arrays in the correct column order
  const headers = reviewTab[0];
  const newRowsArray = newRows.map(row => 
    headers.map(header => row[header] !== undefined ? row[header] : "")
  );
  
  // Add new rows to sheet
  if (newRowsArray.length > 0) {
    const startRow = quarterlyReviews.getLastRow() + 1;
    quarterlyReviews.getRange(startRow, 1, newRowsArray.length, newRowsArray[0].length)
      .setValues(newRowsArray);
  }
}

function getCurrentQuarter() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: Math.floor(today.getMonth() / 3) + 1
  };
}

function getQuarterDates(year, quarter) {
  const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const endMonth = startMonth + 2; // 2, 5, 8, 11
  
  const start = new Date(year, startMonth, 1); // First day of first month
  const end = new Date(year, endMonth + 1, 0); // Last day of last month
  
  return { start, end };
}
```