import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { TESTCASE_KEYWORDS, TESTCASE_PROMPT_SUFFIX } from './prompt-config.js';
 
document.getElementById('run_OpenAPI').addEventListener('click', async (event) => {
  event.preventDefault();
  await handleAPIRequest('/askOPENAPI');
});
 
document.getElementById('run_GROQAPI').addEventListener('click', async (event) => {
  event.preventDefault();
  await handleAPIRequest('/askGROQAPI');
});
 
document.addEventListener('click', function (event) {
  if (event.target?.classList.contains('exportBtn')) {
    exportToWord(event.target);
  }
});
 
document.addEventListener('click', function (event) {
  if (event.target?.classList.contains('exportTemplateBtn')) {
    const table = event.target.closest('.resultTable');
    if (!table) {
      showError("❌ Không tìm thấy bảng để export");
      return;
    }
   
    // Trích xuất dữ liệu từ DOM
    const testCases = [];
    const rows = table.querySelectorAll('tbody tr');
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
 
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const testCase = {};
 
      headers.forEach((key, index) => {
        let value = cells[index]?.textContent.trim() || '';
        if (key === 'Steps') {
          value = value.split(',').map(step => step.trim()).filter(Boolean);
        }
 
        testCase[key] = value;
      });
 
      testCases.push(testCase);
    });
 
    exportDocx(testCases); // ✅ Gửi dữ liệu đúng kiểu cho exportDocx
  }
});

document.addEventListener('input', function (event) {
  const userInput = document.getElementById('userInput').value;
  const isEmpty = userInput.trim().length === 0;

  document.getElementById('run_OpenAPI').disabled = isEmpty;
  document.getElementById('run_GROQAPI').disabled = isEmpty;
});

async function handleAPIRequest(endpoint) {
  document.getElementById('loadingOverlay').style.display = 'flex';
  const userInput = document.getElementById('userInput').value;
  showUserMessage(userInput);
 
  const data = document.getElementById('userInput').value;
  const resultByKeyword = isTestCaseRequest(userInput); // sync
  const resultByAI = await isTestCaseByAI(userInput);
  const result = resultByKeyword || resultByAI;
  let input = result ? data + TESTCASE_PROMPT_SUFFIX : data;
 
  try {
    const response = await fetch(endpoint, {
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
};
 
function displayTestCases(content) {
  const responseBox   = document.getElementById('responseDisplay');
  const jsonContent =  content.match(/\[\s*{[\s\S]*?}\s*\]/);
  console.log("👉 jsonContent:",content)
  if(jsonContent==null){
    throw showError('❌ Không chuẩn hóa được dữ liệu:')
  }
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
 
  let tableHTML ='<table class="resultTable" border="1" style="border-collapse: collapse; width: 100%; font-size: 14px;"><thead><tr>';
  try{
    const keys = Object.keys(testCases[0]);
    // Tạo tiêu đề bảng từ các key
    let socot=0;
    keys.forEach((key,index )=> {
      tableHTML += `<th>${key}</th>`;
      if (index === keys.length - 1) {
        socot= keys.length;
      }
    });
    tableHTML += '</thead>';
    // Lặp qua mỗi test case và tạo một dòng cho nó
    testCases.forEach((testCase) => {
      tableHTML += '<tr>';
      keys.forEach(key => {
        let value = testCase[key] || 'Không xác định'; // Gán giá trị mặc định nếu không có key
        // Nếu là mảng (ví dụ: Steps), biến nó thành chuỗi
        if (Array.isArray(value)) {
          value = value.map((step, idx) => `${idx + 1}. ${step},`).join('<br>');
        }
        // Nếu là đối tượng (ví dụ: DataTest), chuyển sang chuỗi JSON
        if (typeof value === 'object') {
          value = Object.entries(value)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(',\n');
        }
          tableHTML += `<td>${value}</td>`;
        });
        tableHTML += '</tr>';
      });  
        tableHTML += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="${socot}">
                <button class="exportBtn">Export to Word</button>
                <button class="exportTemplateBtn">Export Template</button>
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
 
function isTestCaseRequest(text) {
  const normalizedText = text.toLowerCase();
 
  return TESTCASE_KEYWORDS.some(key => {
    const pattern = key.split(" ").join("(\\s+\\w+)*\\s+");
    const regex = new RegExp(pattern, "i");
    return regex.test(normalizedText);
  });
}
 
async function isTestCaseByAI(input) {
  const prompt = `Input: "${input}"\nĐây có phải là yêu cầu tạo test case không? Trả lời duy nhất bằng: true hoặc false.`;
  try {
  const response = await fetch('/askGROQAPI', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt })
  });
 
  const result = await response.json();
  const reply = result.reply.trim().toLowerCase();
 
  return reply.includes('true');
} catch (error) {
  showError("❌ Lỗi khi gọi AI:" + error);
  return false; // fallback an toàn
}
}
 
async function exportToWord(button,filename = `TestCases_${getCurrentTimestamp()}.docx`) {
  const cssText = await fetch('/word-style.css').then(res => res.text());
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Export HTML To Word</title>
      <style>${cssText}</style>
    </head><body>`;
  const footer = `</body></html>`;
 
  // Tìm table gần nhất chứa nút được nhấn
  const table = button.closest('.resultTable');
  if (!table) {
    showError('❌ Không tìm thấy bảng để export.');
    return;
  }
 
  const clonedTable = table.cloneNode(true);
  // Xóa phần tfoot
  const tfoot = clonedTable.querySelector('tfoot');
  if (tfoot) {
    tfoot.remove();
}
  const tableHTML = clonedTable.outerHTML;
 
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
 
async function exportDocx(testCases) {
  console.log("👉 testCases:", testCases);
  try {
    // Tải file mẫu DOCX từ server
    const response = await fetch('/templates/TestCases_template01.docx');
    if (!response.ok) {
      throw new Error('Không thể tải file mẫu DOCX');
    }
    const buffer = await response.arrayBuffer();
    const zip = new PizZip(buffer);
    // Tạo dữ liệu từ testCases
    const data = {
      testcases: testCases.map((tc, i) => ({
        index: i + 1,
        TestCaseID: tc.TestCaseID,
        Title: tc.Title || 'Không có tiêu đề',
        Description: tc.Description || 'Không có Description',
        PreConditions: tc.PreConditions || 'Không xác định',
        DataTest: tc.DataTest || 'Không xác định',
        Steps: (tc.Steps || []).map((step) => `${step}`).join("\n"),
        Expected: tc.Expected ||  'Không xác định'
      }))
    };
    console.log("👉 Data chuẩn bị chèn vào template:", data);
    // Khởi tạo Docxtemplater theo chuẩn mới
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    }); 
    try {
      // Render file DOCX
      doc.render(data);
    } catch (error) {
      console.error('Render error:', error);
      showError('❌ Lỗi khi render file Word');
      return;
    }
 
    // Lấy blob từ kết quả render
    const blob = doc.getZip().generate({ type: 'blob' });
    // Sử dụng FileSaver.js để download file
    saveAs(blob, `TestCases_${getCurrentTimestamp()}.docx`);
  } catch (error) {
    console.error('Lỗi khi xử lý exportDocx:', error);
    showError('❌ Lỗi khi xử lý file DOCX');
  }
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

function getCurrentTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // tháng bắt đầu từ 0
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const currentTime = `${yyyy}${mm}${dd}${hh}${mi}${ss}`
  return currentTime ;
}