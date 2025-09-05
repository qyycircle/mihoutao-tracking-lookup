import express from 'express';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 允许前端静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 简单健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// 读取CSV并建立内存索引
let records = [];
const csvPath = path.join(__dirname, 'data', 'data.csv');

function loadCsv() {
  return new Promise((resolve, reject) => {
    const newRecords = [];
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => {
        // 期望表头: trackingNo, name, phone
        const trackingNo = String(row.trackingNo || row.tracking || row.no || '').trim();
        const name = String(row.name || row.sender || '').trim();
        const phone = String(row.phone || row.mobile || '').trim();
        if (trackingNo && (name || phone)) {
          newRecords.push({ trackingNo, name, phone });
        }
      })
      .on('end', () => {
        records = newRecords;
        resolve();
      })
      .on('error', (err) => reject(err));
  });
}

// 启动时加载一次
loadCsv().catch((e) => {
  console.error('CSV 加载失败:', e);
});

// 提供手动刷新接口（可选）
app.post('/api/reload', async (req, res) => {
  try {
    await loadCsv();
    res.json({ ok: true, count: records.length });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
});

// 搜索接口：支持按手机号或姓名
app.get('/api/search', (req, res) => {
  const { phone = '', name = '' } = req.query;
  const qPhone = String(phone).trim();
  const qName = String(name).trim();

  if (!qPhone && !qName) {
    return res.status(400).json({ ok: false, message: '请提供手机号或寄件人姓名' });
  }

  // 模糊匹配：手机号支持尾号匹配，姓名支持包含匹配
  const results = records.filter((r) => {
    const phoneMatch = qPhone ? r.phone.includes(qPhone) || r.phone.endsWith(qPhone) : true;
    const nameMatch = qName ? r.name.includes(qName) : true;
    return phoneMatch && nameMatch;
  });

  res.json({ ok: true, total: results.length, results });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 