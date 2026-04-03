/**
 * ServiceSetu Pricing Engine
 * Calculates transparent pricing breakdown for customers
 *
 * Formula:
 *   workerPrice      = worker's demanded price (or service basePrice if no worker)
 *   serviceFee       = workerPrice × serviceFeePercent  (platform profit)
 *   maintenanceFee   = fixed platform fee
 *   gstAmount        = GST on (serviceFee + maintenanceFee)  — GST on platform charges only
 *   totalAmount      = workerPrice + serviceFee + maintenanceFee + gstAmount
 */

const PLATFORM_CONFIG = {
  serviceFeePercent:  0.20,   // 20% of worker price
  maintenanceFee:     20,     // ₹20 fixed
  gstPercent:         0.18,   // 18% GST on platform charges only
}

/**
 * Calculate full pricing breakdown
 * @param {number} workerPrice - Price demanded by worker (or service basePrice)
 * @returns {Object} Full pricing breakdown
 */
const calculatePricing = (workerPrice) => {
  const wp            = Math.round(workerPrice)
  const serviceFee    = Math.round(wp * PLATFORM_CONFIG.serviceFeePercent)
  const maintenanceFee = PLATFORM_CONFIG.maintenanceFee
  const platformCharges = serviceFee + maintenanceFee
  const gstAmount     = Math.round(platformCharges * PLATFORM_CONFIG.gstPercent)
  const totalAmount   = wp + serviceFee + maintenanceFee + gstAmount

  return {
    workerPrice:      wp,
    serviceFee,
    maintenanceFee,
    gstAmount,
    platformCharges,
    totalAmount,
    breakdown: [
      { label: 'Worker Price',       amount: wp,              type: 'worker'      },
      { label: 'Service Fee (20%)',  amount: serviceFee,      type: 'platform'    },
      { label: 'Maintenance Fee',    amount: maintenanceFee,  type: 'platform'    },
      { label: 'GST (18%)',          amount: gstAmount,       type: 'tax'         },
    ],
  }
}

module.exports = { calculatePricing, PLATFORM_CONFIG }