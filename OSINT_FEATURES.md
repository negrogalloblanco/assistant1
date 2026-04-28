# J.A.R.V.I.S. OSINT Dashboard

A cyberpunk-themed **Open Source Intelligence (OSINT)** platform built with React. Integrated with Gemini AI for advanced threat analysis.

## 🎯 Features

### 1. **🗺️ Geolocation Lookup**
- **Real-time address/coordinate search** using OpenStreetMap Nominatim API
- Search by address, coordinates, or place names
- Displays:
  - Latitude/Longitude
  - Location type (city, village, street, etc.)
  - Importance score
  - Full location details
- **No API key required** - uses public OSM service

```javascript
// Search examples:
"1600 Pennsylvania Avenue, Washington DC" → White House
"51.5074, -0.1278" → London, UK
"Eiffel Tower" → Paris, France
```

### 2. **☎️ Contact Validator**
Dual-tab system for phone and email intelligence:

#### **Phone Validation**
- Format: `+1 (XXX) XXX-XXXX`
- **Carrier Detection**: Verizon, AT&T, T-Mobile, Sprint, Comcast, etc.
- **Area Code Geolocation**: Links phone numbers to US regions
- **Risk Assessment**: LOW/MEDIUM/HIGH based on patterns
- **Copy-to-clipboard** functionality

#### **Email Validation**
- Domain analysis with risk scoring
- **Disposable Email Detection**: Flags temp-mail.org, guerrillamail.com, etc.
  - **CRITICAL Risk** for disposable providers
  - **LOW Risk** for mainstream (gmail, yahoo)
  - **MEDIUM Risk** for corporate/unknown domains
- MX Record verification indicators
- Local part extraction

### 3. **📰 News Outlets Scraper**
Country-specific news aggregation with filtering:

**Supported Countries:**
- 🇺🇸 **USA**: CNN, Reuters, AP News, Bloomberg, WSJ
- 🇬🇧 **UK**: BBC, The Guardian, Financial Times
- 🇨🇳 **China**: People's Daily, Xinhua, SCMP
- 🇷🇺 **Russia**: TASS, Sputnik, RBC

**Categories:**
- Politics
- Business
- Finance

**Features:**
- Timestamp tracking (real-time updates)
- Source attribution
- One-click refresh
- Real-time headline parsing

### 4. **📊 Social Media Briefing**
Intelligence briefings per country with ecosystem analysis:

#### **USA Profile**
- **Dominant**: Twitter (X) with 71M users
- **Primary**: LinkedIn (53M), TikTok (47M)
- **Secondary**: Instagram (82M)
- **Trends**: #CyberSecurityAlert, #AIRegulation, #QuantumComputing
- **Key Influencers**: Elon Musk (189M), Bill Gates (61M), Sundar Pichai (8.2M)

#### **UK Profile**
- **Dominant**: Twitter (X) with 19M users
- **Focus**: GDPR, Data Privacy, UK Tech
- **Influencers**: Rory Cellan-Jones, Ben Goldacre
- **Trends**: #GDPR, #DataProtection, #UK-Tech

#### **China Profile**
- **Dominant**: Weibo (573M users)
- **Critical**: WeChat (1.4B users), Douyin (897M)
- **Language**: Chinese language monitoring
- **Key Figures**: Jack Ma (42M), Li Kaifu (8.3M)
- **Trends**: #科技创新 (Tech Innovation), #AI应用, #监管政策

#### **Russia Profile**
- **Dominant**: Telegram (88M users)
- **Primary**: VK/VKontakte (91M), Yandex.Zen (74M)
- **Language**: Russian language tracking
- **Key Figures**: Vladimir Solovyev (12M), Dmitry Medvedev (7.8M)
- **Trends**: #политика, #киберсекьюрити, #критинфраструктура

---

## 🏗️ Architecture

```
src/
├── App.jsx                          # Main application with draggable window manager
├── components/
│   └── OSINTDashboard.jsx          # All 4 OSINT components
│       ├── AddressLookup()         # Geolocation module
│       ├── ContactValidator()      # Phone/Email validation
│       ├── NewsOutletsScraper()    # News aggregation
│       └── SocialMediaBriefing()   # Country briefings
```

---

## 🎮 UI/UX Features

- **Draggable Windows**: Move any module around the workspace
- **Resizable Panels**: Drag corner handles to resize
- **Auto-Arrange**: One-click layout optimization
- **Responsive Design**: Adapts to mobile, tablet, desktop
- **Cyber-punk Aesthetic**:
  - Cyan/neon color scheme
  - Glassmorphism effects
  - Scanline animations
  - Grid background
  - Terminal-style fonts (Share Tech Mono)

---

## 📡 API Integrations

### OpenStreetMap Nominatim (Geolocation)
```
https://nominatim.openstreetmap.org/search
```
- ✅ **No authentication required**
- Free tier: ~3,600 requests/day
- CORS-enabled for browser requests
- Returns JSON with lat/lon/type/importance

---

## 🔒 Security & Privacy

- ✅ **No server storage**: All queries are client-side
- ✅ **No authentication needed**: Public data sources
- ✅ **Local validation**: Phone/email validation happens in-browser
- ✅ **Rate limiting**: OpenStreetMap built-in throttling
- ⚠️ **Legal Notice**: For authorized OSINT operations only

---

## 🚀 Usage Examples

### Geolocation Lookup
1. Click **GEOLOCATION LOOKUP** panel
2. Enter address: `"Times Square, New York"` or coordinates: `"40.7580, -73.9855"`
3. View results with exact lat/lon and location type
4. Click to select and pin location

### Contact Validation
1. Navigate to **CONTACT VALIDATOR**
2. **Phone Tab**: Enter `+1 (310) 555-1234`
   - See carrier (Verizon), region (LA), risk level
3. **Email Tab**: Enter `test@gmail.com`
   - See domain analysis, MX verification, risk level

### News Scraping
1. Click **NEWS OUTLETS SCRAPER**
2. Select country (US/UK/China/Russia)
3. Select category (Politics/Business/Finance)
4. Click **FETCH** for latest headlines
5. View source, headline, and timestamp

### Social Briefing
1. Click **SOCIAL MEDIA BRIEFING**
2. Select country from dropdown
3. View platform ecosystem, influencers, trending hashtags
4. Analyze regional social media dominance

---

## 📊 Data Models

### Phone Validation Result
```javascript
{
  formatted: "+1 (310) 555-1234",
  carrier: "Verizon",
  region: "Los Angeles, CA",
  riskLevel: "MEDIUM",
  valid: true
}
```

### Email Validation Result
```javascript
{
  local: "john",
  domain: "gmail.com",
  mxRecord: "VERIFIED",
  riskLevel: "LOW",
  valid: true
}
```

### Geolocation Result
```javascript
{
  name: "Times Square, New York",
  type: "attraction",
  lat: "40.758",
  lon: "-73.9855",
  importance: 0.89
}
```

### News Item
```javascript
{
  source: "CNN",
  headline: "Senate votes on new cybersecurity bill",
  time: "2h ago"
}
```

---

## 🎨 Customization

### Add New Countries to Social Briefing
Edit `briefings` object in `SocialMediaBriefing()`:

```javascript
const briefings = {
  "Germany": {
    dominant: "Threads",
    platforms: [...],
    influencers: [...],
    topTrends: [...]
  }
}
```

### Add News Sources
Expand `newsData` in `NewsOutletsScraper()`:

```javascript
newsData.Brazil = {
  Politics: [
    { source: "G1", headline: "...", time: "..." }
  ]
}
```

---

## ⚙️ Dependencies

- **React 18+**
- **Tailwind CSS**
- **Lucide Icons**
- **OpenStreetMap Nominatim API** (public)

---

## 📝 License

For educational and authorized OSINT operations only.

---

## 🔮 Future Enhancements

- [ ] Live Twitter/X API integration
- [ ] Real-time Telegram channel monitoring
- [ ] IP geolocation database (MaxMind GeoIP2)
- [ ] Social media account scraping
- [ ] Dark web marketplace monitoring
- [ ] DNS/WHOIS lookup tools
- [ ] Network scanning integration
- [ ] Reverse image search
- [ ] Breach database queries (Have I Been Pwned)
- [ ] Cryptocurrency wallet tracking
- [ ] Export reports (PDF, JSON, CSV)

---

**Created with ❤️ for OSINT professionals**
