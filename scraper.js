const axios = require("axios");
const cheerio = require("cheerio");
const { wrapper } = require("axios-cookiejar-support");
const tough = require("tough-cookie");

const BASE_URL = "https://portal.dinus.ac.id";

/**
 * Search for students, lecturers, or alumni in the portal
 * @param {string} keyword - The search keyword (name, NIM, etc.)
 * @param {number} pilihan - Search type (1 = mahasiswa, 2 = dosen, 3 = alumni)
 * @returns {Promise<Object[]|Object>} - Array of results or error object
 */
const search = async (keyword, pilihan) => {
    try {
        console.log(`[DEBUG] Starting search for keyword: "${keyword}", pilihan: ${pilihan}`);
        
        const jar = new tough.CookieJar();
        const session = wrapper(axios.create({ baseURL: BASE_URL, jar }));

        console.log(`[DEBUG] Making GET request to: ${BASE_URL}/`);
        const resGet = await session.get("/");
        console.log(`[DEBUG] GET response status: ${resGet.status}`);
        
        const $ = cheerio.load(resGet.data);
        const token = $('input[name="_token"]').attr("value");
        if (!token) throw new Error("Token gak ketemu di halaman root.");
        console.log(`[DEBUG] Token found: ${token.substring(0, 10)}...`);

        const payload = new URLSearchParams({
            _token: token,
            pencarian: keyword,
            pilihan_search: pilihan.toString(),
        });
        console.log(`[DEBUG] Payload: ${payload.toString()}`);

        console.log(`[DEBUG] Making POST request to: ${BASE_URL}/prosesCari`);
        const resPost = await session.post("/prosesCari", payload.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        console.log(`[DEBUG] POST response status: ${resPost.status}`);

        const $$ = cheerio.load(resPost.data);
        const links = [];
        $$("#datatable a").each((i, el) => {
            const href = $$(el).attr("href");
            if (href) links.push(href);
        });
        console.log(`[DEBUG] Found ${links.length} links:`, links);

        const results = [];
        for (let i = 0; i < links.length; i++) {
            const url = links[i];
            console.log(`[DEBUG] Processing link ${i + 1}/${links.length}: ${url}`);
            
            const resDetail = await session.get(url);
            console.log(`[DEBUG] Detail response status: ${resDetail.status}`);
            
            const $$$ = cheerio.load(resDetail.data);

            const detail = {};
            $$$("table tr").each((i, el) => {
                const cols = $$$("td", el).map((_, td) => $$$(td).text().trim()).get();
                if (cols.length >= 3) {
                    detail[cols[0]] = cols[2];
                }
            });
            
            console.log(`[DEBUG] Extracted detail for link ${i + 1}:`, detail);
            results.push(detail);
        }

        console.log(`[DEBUG] Scraping completed. Total results: ${results.length}`);
        return results;
    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
        console.error(`[ERROR] Stack trace:`, err.stack);
        return { error: err.message };
    }
};

module.exports = {
    search
};