# Cloudflare 优选IP 收集器
由于GitHub版的被官方以滥用资源为理由封禁了项目，特推出基于Cloudflare worker版的优选IP，更快，更高效，更直观！抛弃github Action~

<p align="center">
  <a href="https://youtu.be/@AbdullahMusicWorldWide" target="_blank">
    <img src="https://img.icons8.com/color/48/000000/youtube-play.png" alt="YouTube" width="40" height="40"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/ethgan/BestIP" target="_blank">
    <img src="https://img.icons8.com/ios-glyphs/48/000000/github.png" alt="GitHub" width="40" height="40"/>
  </a>
  &nbsp;&nbsp;
  <a href="[https://t.me/yt_hytj](https://t.me/ABDULLAHMETHOD)" target="_blank">
    <img src="https://img.icons8.com/color/48/000000/telegram-app--v1.png" alt="Telegram" width="40" height="40"/>
  </a>
</p>

# CF IP Collector & Speed Tester

A Cloudflare Workers-based tool for collecting and speed-testing optimized Cloudflare IP addresses. Automatically gathers IPs from multiple public sources with a web interface for management and testing.

## ✨ Features

- **🔄 Automatic Collection**: Scheduled collection of Cloudflare IP addresses from multiple public sources
- **⚡ Smart Speed Testing**: One-click speed test with batch IP latency testing
- **📁 Multiple Formats**: Support for TXT downloads and raw data access
- **🔗 ITDog Integration**: Export IP lists to ITDog for batch TCPing tests
- **🎨 Modern Interface**: Clean, responsive web interface
- **📊 Real-time Sorting**: Automatic latency-based sorting after speed tests

## 🚀 Quick Start

### Prerequisites
- Cloudflare Workers account
- Web browser with JavaScript enabled
- Basic understanding of Cloudflare IP management

### Installation
1. Deploy the Worker to your Cloudflare account
2. Configure your environment variables
3. Access the web interface through your Worker URL

### Usage
1. Open the web interface
2. Click "Collect IPs" to gather latest Cloudflare IPs
3. Use "Speed Test" to measure latency
4. Export results in your preferred format

## 📋 Supported IP Sources
- Public Cloudflare IP repositories
- Community-maintained lists
- Real-time IP databases

- Cloudflare 账户
- Workers 权限
- KV 命名空间（用于存储 IP 数据）

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username//BestIP/.git
   cd BestIP
   ```

2. **创建 KV 命名空间**
   - In the Cloudflare Dashboard, go to Workers & Pages
   -Create a new key-value namespace, preferably named `IP_STORAGE`.
   - Record the namespace ID

3. **Configure Wrangler**

- Copy `wrangler.toml.example` to `wrangler.toml`

- Update the KV namespace ID in `wrangler.toml`:

``toml

[[kv_namespaces]]

binding = "IP_STORAGE"

id = "your_kv_namespace_id_here"

```

4. **Deploy to Cloudflare**

``bash

npm install

npx wrangler deploy

```

5. **Configure Scheduled Tasks** (Optional)

- Add a scheduled trigger for the Worker in the Cloudflare Dashboard

- It is recommended to set it to run every 12 hours

## 📖 How to Use

### Web Interface

Access the deployed Worker address to use the full functionality:

- **View IP List**: Browse all collected Cloudflare IP addresses

- **One-Click Speed ​​Test**: Batch test all IPs Delay, automatic sorting

- **Export Data**: Download a list of IPs in TXT format

- **ITDog Integration**: Copy the IP list to ITDog for more detailed testing

### API Interface

- `GET /` - Main page

- `GET /ips` or `GET /ip.txt` - Get a plain text list of IPs

- `GET /raw` - Get raw JSON data

- `POST /update` - Manually trigger IP updates

- `GET /speedtest?ip=<ip>` - Test the speed of a specified IP

- `GET /itdog-data` - Get ITDog format data

## ⚙️ Configuration Instructions

### Data Source

The project automatically collects data from multiple public Cloudflare IP data sources, including:

- ip.164746.xyz

- ip.haogege.xyz

- stock.hostmonit.com/CloudFlareYes

- api.uouin.com/cloudflare.html

- addressesapi.090227.xyz

- www.wetest.vip

### Environment Variables

No additional environment variables are needed; all configurations are managed through code.

## 🛠️ Development

### Local Development

```bash

# Install Dependencies

npm install

# Start Local Development Server

npx wrangler dev

# Deploy to Production Environment

npx wrangler deploy

```

### Project Structure

```
├── cfip.js # Main Worker Code

├── wrangler.toml # Wrangler Configuration

├── package.json # Project Dependencies

└── README.md # Project Description

```

## 📊 Technology Stack

- **Runtime**: Cloudflare Workers

- **Storage**: Cloudflare KV

- **Frontend**: Native HTML/CSS/JavaScript

- **Deployment**: Wrangler

## 🤝 Contributions

Welcome to submit Issues and Pull Requests!

1. Fork this project

2. Create a feature branch (`git checkout -b feature/AmazingFeature`)

3. Commit changes (`git commit -m 'Add some AmazingFeature'`)

4. Push to the branch (`git push origin feature/AmazingFeature`)

5. Create a Pull Request

## 📄 Open Source License

This project is open source under the MIT license. See the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for learning and research purposes only. Do not use it for commercial purposes or in violation of the relevant terms of service. Users assume all risks associated with it.

If this project is helpful to you, please give it a ⭐️ to support it!
