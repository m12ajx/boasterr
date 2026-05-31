const cron = require('node-cron');
const { getIntegrationSdk } = require('./api-util/sdk');
const { denormalisedResponseEntities } = require('./api-util/data');

const handleExpiredTransaction = async (iSdk, tx) => {
  try {
    await iSdk.transactions.transition({
      id: tx.id?.uuid,
      transition: 'transition/operator-mark-delivered',
      params: {},
    });

    await iSdk.transactions.updateMetadata({
      id: tx.id?.uuid,
      metadata: { timerRunning: false },
    });
  } catch (e) {
    console.error(`Error handling expired transaction ${tx.id?.uuid}:`, e);
  }
};

const start = () => {
  // Runs every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    const iSdk = getIntegrationSdk();

    try {
      const txRes = await iSdk.transactions.query({
        meta_timerRunning: true,
        include: ['listing'],
      });

      const transactions = denormalisedResponseEntities(txRes);

      const nowUtcMs = Date.now();

      for (const tx of transactions) {
        const confirmTransition = tx.attributes.transitions?.find(
          elm => elm.transition === 'transition/confirm-payment'
        );
        const createdAt = confirmTransition?.createdAt;
        const timeRequiredHours = tx.listing?.attributes?.publicData?.timeRequired;

        if (!createdAt || !timeRequiredHours) continue;

        // Both are UTC — no timezone conversion needed
        const deadlineMs = new Date(createdAt).getTime() + timeRequiredHours * 60 * 60 * 1000;

        if (nowUtcMs >= deadlineMs) {
          console.log(
            `Countdown expired for transaction ${tx.id?.uuid} (deadline: ${new Date(
              deadlineMs
            ).toISOString()})`
          );
          await handleExpiredTransaction(iSdk, tx);
        }
      }
    } catch (e) {
      console.error('Error running cron job:', e);
    }
  });
};

module.exports = { start };
