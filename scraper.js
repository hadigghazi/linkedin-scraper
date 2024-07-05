const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;

const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const jobListings = await scrapeJobListings(page, 'MLOps');
  await fs.writeFile('jobs.json', JSON.stringify(jobListings, null, 2), 'utf-8');
  await browser.close();
})();
