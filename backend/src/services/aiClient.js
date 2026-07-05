const axios = require('axios');
require('dotenv').config();

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function fetchFootfallForecast(facilityId) {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/predict/footfall`, {
      facility_id: facilityId,
      use_sample_data: true,
    }, { timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error('[AI Client] Footfall forecast failed:', error.message);
    return null;
  }
}

async function fetchStockoutForecast(medicines) {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/predict/stockout`, {
      medicines,
    }, { timeout: 15000 });
    return response.data;
  } catch (error) {
    console.error('[AI Client] Stockout forecast failed:', error.message);
    return null;
  }
}

async function checkAIHealth() {
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch {
    return { status: 'offline' };
  }
}

module.exports = { fetchFootfallForecast, fetchStockoutForecast, checkAIHealth };
