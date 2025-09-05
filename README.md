# 快递单号查询工具

一个简单的手机端网页工具，可以通过手机号或寄件人姓名查询快递单号。

## 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 云端部署（Render）

### 方法一：通过GitHub部署（推荐）

1. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/猕猴桃查单号小工具.git
   git push -u origin main
   ```

2. **在Render部署**
   - 访问 [render.com](https://render.com)
   - 注册/登录账号
   - 点击 "New +" → "Web Service"
   - 连接你的GitHub仓库
   - 设置：
     - **Name**: mihoutao-tracking-lookup
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free
   - 点击 "Create Web Service"

3. **部署完成后**
   - Render会给你一个URL，例如：`https://mihoutao-tracking-lookup.onrender.com`
   - 任何人都可以通过这个URL访问你的工具

### 方法二：直接上传代码

1. 访问 [render.com](https://render.com)
2. 点击 "New +" → "Web Service"
3. 选择 "Build and deploy from a Git repository"
4. 上传你的代码文件夹
5. 按照方法一的设置配置

## 数据更新

部署后，你需要通过以下方式更新数据：

### 方法一：通过GitHub更新（推荐）
1. 修改 `data/data.csv` 文件
2. 提交并推送到GitHub
3. Render会自动重新部署

### 方法二：通过Render控制台
1. 登录Render控制台
2. 找到你的服务
3. 在 "Environment" 标签页中，你可以手动编辑 `data/data.csv`

## 注意事项

- Render免费版有使用限制，但足够个人使用
- 免费版服务在无访问时会休眠，首次访问可能需要等待几秒
- 建议定期备份你的CSV数据文件

## 其他部署选项

如果你有其他云服务账号，也可以考虑：
- **Vercel**: 适合静态站点
- **Railway**: 类似Render的简单部署
- **Heroku**: 老牌云服务（现在收费）
- **腾讯云/阿里云**: 国内服务商
