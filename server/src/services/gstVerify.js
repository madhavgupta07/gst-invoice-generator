/**
 * GST Verification Service
 * 
 * Two modes:
 * 1. CAPTCHA-based: Uses the official GST portal (free, no API key needed)
 *    - getCaptcha() → returns sessionId + CAPTCHA image
 *    - verifyWithCaptcha(sessionId, gstin, captcha) → returns GST details
 * 
 * 2. API-based: Uses third-party API (needs GST_API_KEY)
 *    - verifyGSTIN(gstin) → returns GST details
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');

// In-memory session store (sessionId → { jar, timestamp })
const gstSessions = new Map();

// Clean up sessions older than 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, data] of gstSessions) {
        if (now - data.timestamp > 10 * 60 * 1000) {
            gstSessions.delete(id);
        }
    }
}, 60 * 1000);

/**
 * Step 1: Fetch CAPTCHA from the GST portal.
 * Returns { sessionId, image } where image is a base64 data URI.
 */
async function getCaptcha() {
    try {
        const { wrapper } = await import('axios-cookiejar-support');
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true }));

        // Hit the search page first to establish session cookies
        await client.get('https://services.gst.gov.in/services/searchtp', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        // Fetch the CAPTCHA image
        const captchaRes = await client.get('https://services.gst.gov.in/services/captcha', {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const captchaBase64 = Buffer.from(captchaRes.data).toString('base64');
        const sessionId = crypto.randomUUID();

        gstSessions.set(sessionId, { jar, timestamp: Date.now() });

        return {
            sessionId,
            image: `data:image/png;base64,${captchaBase64}`,
        };
    } catch (error) {
        console.error('getCaptcha error:', error.message);
        return { error: 'Failed to fetch CAPTCHA from GST portal. Try again.' };
    }
}

/**
 * Step 2: Submit GSTIN + solved CAPTCHA to get taxpayer details.
 * @param {string} sessionId - From getCaptcha()
 * @param {string} gstin - 15-character GSTIN
 * @param {string} captcha - User-solved CAPTCHA text
 */
async function verifyWithCaptcha(sessionId, gstin, captcha) {
    try {
        const sessionData = gstSessions.get(sessionId);
        if (!sessionData) {
            return { valid: false, error: 'Session expired. Please refresh the CAPTCHA.' };
        }

        const { wrapper } = await import('axios-cookiejar-support');
        const client = wrapper(axios.create({ jar: sessionData.jar, withCredentials: true }));

        const response = await client.post(
            'https://services.gst.gov.in/services/api/search/taxpayerDetails',
            { gstin, captcha },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            }
        );

        const data = response.data;

        // Clean up used session
        gstSessions.delete(sessionId);

        if (data && data.gstin) {
            // Extract useful fields
            const stateCode = gstin.substring(0, 2);
            const address = data.pradr?.adr || data.pradr?.addr?.bnm || '';

            return {
                valid: true,
                gstin: data.gstin,
                name: data.tradeNam || data.lgnm || '',
                legalName: data.lgnm || '',
                tradeName: data.tradeNam || '',
                address: address,
                status: data.sts || '',
                stateCode: stateCode,
                type: data.dty || '',
                registrationDate: data.rgdt || '',
                lastUpdated: data.lstupdt || '',
                raw: data,
            };
        }

        return {
            valid: false,
            error: data?.error?.message || data?.message || 'Invalid CAPTCHA or GSTIN. Please try again.',
            raw: data,
        };
    } catch (error) {
        console.error('verifyWithCaptcha error:', error.message);
        gstSessions.delete(sessionId);
        return { valid: false, error: 'Verification failed. Please try again.' };
    }
}

/**
 * API-based verification (requires GST_API_KEY).
 */
async function verifyGSTIN(gstin) {
    const apiKey = process.env.GST_API_KEY;
    const apiUrl = process.env.GST_API_URL;

    if (!apiKey || !apiUrl) {
        return {
            valid: false,
            error: 'GST verification API not configured. Use CAPTCHA verification instead.',
        };
    }

    try {
        const response = await axios.get(`${apiUrl}?gstin=${gstin}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        const data = response.data;
        if (data && data.data) {
            const info = data.data;
            return {
                valid: true,
                name: info.legalNameOfBusiness || info.tradeNameOfBusiness || '',
                address: info.principalPlaceOfBusinessAddress || info.address || '',
                status: info.gstinStatus || info.status || '',
                stateCode: gstin.substring(0, 2),
            };
        }

        return { valid: false, error: 'Could not verify GSTIN.' };
    } catch (error) {
        console.error('GST API error:', error.message);
        return { valid: false, error: 'GST API verification failed.' };
    }
}

module.exports = { getCaptcha, verifyWithCaptcha, verifyGSTIN };
