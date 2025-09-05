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

// 健康检查
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// 手机号脱敏函数
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  
  // 保留前3位和后4位，中间用*号替换
  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 4);
  const middle = '*'.repeat(phone.length - 7);
  
  return start + middle + end;
}

// 读取CSV并建立内存索引
let records = [];
const csvPath = path.join(__dirname, 'data', 'data.csv');

function loadCsv() {
  return new Promise((resolve, reject) => {
    console.log(`[CSV] 开始加载文件: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      console.error(`[CSV] 文件不存在: ${csvPath}`);
      return reject(new Error(`CSV文件不存在: ${csvPath}`));
    }

    const newRecords = [];
    let lineCount = 0;
    
    fs.createReadStream(csvPath)
      .pipe(parse({ 
        columns: true, 
        trim: true,
        skip_empty_lines: true,
        skip_records_with_error: true
      }))
      .on('data', (row) => {
        lineCount++;
        const trackingNo = String(row.trackingNo || row.tracking || row.no || '').trim();
        const name = String(row.name || row.sender || '').trim();
        const phone = String(row.phone || row.mobile || '').trim();
        
        // 只要有快递单号就添加记录
        if (trackingNo) {
          newRecords.push({ trackingNo, name, phone });
        }
      })
      .on('end', () => {
        records = newRecords;
        console.log(`[CSV] 加载完成 - 总行数: ${lineCount}, 有效记录: ${records.length}`);
        console.log(`[CSV] 前3条记录:`, records.slice(0, 3));
        resolve();
      })
      .on('error', (err) => {
        console.error('[CSV] 加载失败:', err);
        reject(err);
      });
  });
}

// 启动时加载一次
loadCsv().catch((e) => {
  console.error('CSV 加载失败:', e);
});

// 手动刷新
app.post('/api/reload', async (req, res) => {
  try {
    await loadCsv();
    res.json({ ok: true, count: records.length });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
});

// 数据统计/排查
app.get('/api/stats', (req, res) => {
  res.json({ 
    ok: true, 
    count: records.length, 
    hasCsv: fs.existsSync(csvPath), 
    csvPath,
    sampleRecords: records.slice(0, 5),
    allNames: records.map(r => r.name).slice(0, 10) // 显示前10个姓名用于调试
  });
});

// 搜索接口：支持按手机号或姓名
app.get('/api/search', (req, res) => {
  const { phone = '', name = '' } = req.query;
  const qPhone = String(phone).trim();
  const qName = String(name).trim();

  console.log(`[SEARCH] 查询条件 - 姓名: "${qName}", 手机: "${qPhone}"`);
  console.log(`[SEARCH] 当前记录数: ${records.length}`);

  if (!qPhone && !qName) {
    return res.status(400).json({ ok: false, message: '请提供手机号或寄件人姓名' });
  }

  // 搜索逻辑
  const results = records.filter((r) => {
    const phoneMatch = qPhone ? r.phone.includes(qPhone) : true;
    const nameMatch = qName ? r.name.includes(qName) : true;
    return phoneMatch && nameMatch;
  });

  // 对结果进行脱敏处理
  const maskedResults = results.map(r => ({
    ...r,
    phone: maskPhone(r.phone)
  }));

  console.log(`[SEARCH] 找到 ${results.length} 条记录`);
  if (results.length > 0) {
    console.log(`[SEARCH] 匹配记录:`, results.slice(0, 3));
  }
  
  res.json({ ok: true, total: results.length, results: maskedResults });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
