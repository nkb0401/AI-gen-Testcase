process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const mime = require('mime');
const app = express();
const PORT = 5000;
 
app.use(cors());
app.use(express.json());
 
// Dùng thư mục public để phục vụ frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/templates', express.static(path.join(__dirname, 'public', 'templates')));
 
mime.define({ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'] });
 
// Route xử lý khi nhấn nút RUN (API call)
app.post('/askOPENAPI', async (req, res) => {
  const userMessage = req.body.message;
  const payload = {
    model: "gpt-4o-mini",
    store: true,
    messages: [{ role: "user", content: userMessage }]
  };
 
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  };
  console.log("📤 Đang gửi request đến OpenAI:");
  console.log("👉 URL:", 'https://api.openai.com/v1/chat/completions');
  console.log("👉 Headers:", headers);
  console.log("👉 Body:", JSON.stringify(payload, null, 2));
  try {
   
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      payload,
      { headers }
    );
    const reply = response.data.choices?.[0]?.message?.content;
    res.json({ reply });
    //console.log("👉 Body:",response.data.choices?.[0]?.message?.content)
 
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
  }
});
 
app.post('/askGROQAPI', async (req, res) => {
  const userMessage = req.body.message;
  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: userMessage }]
  };
 
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
  };
  console.log("📤 Đang gửi request đến OpenAI:");
  console.log("👉 URL:", 'https://api.groq.com/openai/v1/chat/completions');
  console.log("👉 Headers:", headers);
  console.log("👉 Body:", JSON.stringify(payload, null, 2));
  try {
   
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      { headers }
    );
 
    const reply = response.data.choices?.[0]?.message?.content;
    res.json({ reply });
    //console.log("👉 Body:",response.data.choices?.[0]?.message?.content)
 
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
  }
});
 
// Mặc định: nếu route không khớp => trả về index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','index.html'));
 
});
 
app.listen(PORT, () => {
  console.log(`✅ App đang chạy: http://localhost:3000`);
});
