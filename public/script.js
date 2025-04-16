document.getElementById('run_OpenAPI').addEventListener('click', async (event) => {
    event.preventDefault();
    document.getElementById('run_OpenAPI').disabled = true;
    document.getElementById('run_GROQAPI').disabled = true;
    document.getElementById('loadingOverlay').style.display = 'flex';
   
    const input ="Viết test case của rule :" + document.getElementById('userInput').value + "Theo cú pháp:Title: tên test case,Kết quả mong muốn: kết quả khi thực hiện testcase";
   
    try {
      const response = await fetch('/askOPENAPI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
   
      const data = await response.json();
      document.getElementById('output').textContent = data.reply || 'Không có phản hồi từ AI';
    } catch (error) {
      showError('Lỗi khi gọi server backend.' + error);
    }
    // Enable lại button và ẩn loading spinner sau khi xử lý xong
    document.getElementById('run_OpenAPI').disabled = false;
    document.getElementById('run_GROQAPI').disabled = false;
    document.getElementById('loadingOverlay').style.display = 'none';  // Ẩn loading
    document.getElementById('userInput').value = '';
  });
   
  document.getElementById('run_GROQAPI').addEventListener('click', async (event) => {
    event.preventDefault();
    document.getElementById('run_OpenAPI').disabled = true;
    document.getElementById('run_GROQAPI').disabled = true;
    document.getElementById('loadingOverlay').style.display = 'flex';
   
    const userInput = document.getElementById('userInput').value;
    showUserMessage(userInput);
   
  //"Viết toàn bộ test case của rule: " +
    const data = document.getElementById('userInput').value.toUpperCase();
    let Keys = ["gen testcase","gen test case",
      "generate testcase", "generate test case",
      "create testcase", "create test case",
      "tạo testcase", "tạo test case",
      "tạo testcase", "tạo test case"
    ]
    const result = Keys.some(key => data.includes(key.toUpperCase()));
   
    let input = result
      ? data + " .Và theo định dạng JSON với model như sau: Key=Title; value=tên test case, Key=DataTest; value=data đầu vào của testcase, Key=Kết quả mong muốn; value=kết quả khi thực hiện testcase"
      : data;
   
    try {
      const response = await fetch('/askGROQAPI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
   
      const data = await response.json();
      const content = data.reply || 'Không có phản hồi từ AI';
      console.log("👉 content:",content)
      if(result){
      displayTestCases(content);}  
      else{
        const responseBox   = document.getElementById('responseDisplay');
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';
        botMsg.innerHTML = content;
      responseBox.appendChild(botMsg);
      responseBox.scrollTop = responseBox.scrollHeight;
    }
 
  } catch (error) {
    showError('Lỗi khi gọi server backend.'+ error);
  }
    // Enable lại button và ẩn loading spinner sau khi xử lý xong
  document.getElementById('run_OpenAPI').disabled = false;
  document.getElementById('run_GROQAPI').disabled = false;
  document.getElementById('loadingOverlay').style.display = 'none';  // Ẩn loading
  document.getElementById('userInput').value = '';
});
 
function displayTestCases(content) {
  const responseBox   = document.getElementById('responseDisplay');
  const jsonContent =  content.match(/\[\s*{[\s\S]*?}\s*\]/);
 
  console.log("👉 jsonContent:",jsonContent)
  let testCases = [];
 
  try {
    // Nếu truyền vào là chuỗi thì parse, nếu đã là object thì dùng luôn
    if (Array.isArray(jsonContent) && typeof jsonContent[0] === 'string') {
      testCases = JSON.parse(jsonContent[0]); // parse phần tử đầu tiên
    } else if (typeof jsonContent === 'string') {
      testCases = JSON.parse(jsonContent); // nếu là chuỗi JSON
    } else {
      testCases = jsonContent; // nếu đã là object
    }  
    console.log("👉 testCases:",testCases)
  } catch (err) {
    showError('❌ Không parse được JSON:'+ err);
    const responseBox   = document.getElementById('responseDisplay');
      const botMsg = document.createElement('div');
      botMsg.className = 'message bot-message';
      botMsg.innerHTML = content;
      responseBox.appendChild(botMsg);
      responseBox.scrollTop = responseBox.scrollHeight;
    return;
  }
  const botMsg = document.createElement('div');
  botMsg.className = 'message bot-message';
 
  let tableHTML = `
    <table id="resultTable" border="1" style="border-collapse: collapse; width: 100%; font-size: 14px;">
      <thead>
        <tr>
          <th>Stt</th>
          <th>Nội dung kiểm thử</th>
          <th>Kết quả kiểm thử</th>
          <th>Kết quả (Đạt/Không)</th>
        </tr>
      </thead>
      <tbody>
  `;
  try{
    testCases.forEach((testCase, index) => {
      const title = testCase["Title"] || "Không có tiêu đề";
      const dataTest = JSON.stringify(testCase["DataTest"] || {}); // stringify nếu là object
      const expected = testCase["Kết quả mong muốn"] || "Không xác định";
 
      tableHTML += `
      <tr>
        <td>${index + 1}</td>
        <td><b>${title}</b><br>
          <small>Data test: ${dataTest}</small><br>
          <small>Bước thực hiện:</small>
        </td>
        <td>Kết quả mong muốn: ${expected}<br>Kết quả thực tế:</td>
        <td></td>
      </tr>
      `;
    });
 
    tableHTML += `
      </tbody>
      <tfoot>
    <tr>
     <td colspan="4" style="text-align: right;">
      <button id="exportBtn" onclick="exportToWord()">Export to Word</button>
     </td>
    </tr>
   </tfoot>
  </table>
  `;

  botMsg.innerHTML = tableHTML;
  responseBox.appendChild(botMsg);
  responseBox.scrollTop = responseBox.scrollHeight;
 }catch (err) {
  showError('❌ Không hiển thị được kết quả:'+ err);
  return;
 }
}


function exportToWord(filename = 'TestCases.doc') {
 const header = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office'
     xmlns:w='urn:schemas-microsoft-com:office:word'
     xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
   <meta charset='utf-8'>
   <title>Export HTML To Word</title>
   <style>
    table, th, td {
     border: 1px solid black;
     border-collapse: collapse;
    }
    th, td {
     padding: 8px;
     text-align: left;
    }
    table {
     width: 100%;
    }
   </style>
  </head><body>`;
 const footer = `</body></html>`;
 // Clone bảng để thao tác mà không ảnh hưởng bảng gốc
 const table = document.getElementById('resultTable').cloneNode(true);
 // Xóa phần tfoot
 const tfoot = table.querySelector('tfoot');
 if (tfoot) {
  tfoot.remove();
}
 const tableHTML = table.outerHTML;

 const sourceHTML = header + tableHTML + footer;

 const sourceBlob = new Blob(['\ufeff', sourceHTML], {
  type: 'application/msword'
 });

 const url = URL.createObjectURL(sourceBlob);
 const downloadLink = document.createElement("a");

 downloadLink.href = url;
 downloadLink.download = filename;

 document.body.appendChild(downloadLink);
 downloadLink.click();
 document.body.removeChild(downloadLink);
}


function showError(message) {
 const errorDiv = document.getElementById('errorMessage');
 errorDiv.textContent = message;
 errorDiv.style.display = 'block';

 setTimeout(() => {
  errorDiv.style.display = 'none';
 }, 5000); // Tự ẩn sau 5 giây
}


function showUserMessage(text) {
 const responseBox = document.getElementById('responseDisplay');
 const msg = document.createElement('div');
 msg.className = 'message user-message';
 msg.textContent = text;
 responseBox.appendChild(msg);
 responseBox.scrollTop = responseBox.scrollHeight;
}