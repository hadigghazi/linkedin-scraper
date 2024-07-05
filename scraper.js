const puppeteer = require('puppeteer-core');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function fetchJobDescriptionFromURL(jobUrl) {
  try {
    const response = await axios.get(jobUrl);
    const html = response.data;
    const $ = cheerio.load(html);
    const description = $('.show-more-less-html__markup').text().trim();
    return description;
  } catch (error) {
    console.error('Error fetching job description:', error);
    return '';
  }
}

async function scrapeJobListings(page, searchQuery) {
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  const jobListings = await page.evaluate(() => {
    const jobElements = document.querySelectorAll('.base-card--link');
    const jobsData = [];

    jobElements.forEach(job => {
      const titleElement = job.querySelector('.base-search-card__title');
      const companyElement = job.querySelector('.base-search-card__subtitle a');
      const locationElement = job.querySelector('.job-search-card__location');
      const postDateElement = job.querySelector('.job-search-card__listdate');
      const linkElement = job.querySelector('.base-card__full-link');

      if (titleElement && companyElement && locationElement && linkElement) {
        const title = titleElement.textContent.trim();
        const company = companyElement.textContent.trim();
        const location = locationElement.textContent.trim();
        const postDate = postDateElement ? postDateElement.textContent.trim() : '';
        const link = linkElement.getAttribute('href');

        jobsData.push({
          title,
          company,
          location,
          postDate,
          link
        });
      }
    });

    return jobsData;
  });

  return jobListings;
}

async function addDescriptionsToJobs(jobs) {
  const jobsWithDescriptions = await Promise.all(
    jobs.map(async job => {
      const description = await fetchJobDescriptionFromURL(job.link);
      return {
        ...job,
        description
      };
    })
  );

  return jobsWithDescriptions;
}

async function scrapeLinkedInJobs() {
  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const searchQuery = 'MLOps';

    const jobListings = await scrapeJobListings(page, searchQuery);
    await browser.close();

    const jobsWithDescriptions = await addDescriptionsToJobs(jobListings);
    await fs.writeFile('jobs.json', JSON.stringify(jobsWithDescriptions, null, 2), 'utf-8');

    console.log('Job data saved successfully');
  } catch (error) {
    console.error('Problem scraping jobs');
  }
}

scrapeLinkedInJobs();
