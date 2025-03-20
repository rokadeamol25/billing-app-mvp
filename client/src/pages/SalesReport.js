<div className="summary-cards">
  <SummaryCard 
    title="Total Invoiced" 
    value={formatCurrency(reportData.salesSummary.total_invoiced)} 
    icon="file-invoice-dollar"
  />
  <SummaryCard 
    title="Revenue Received" 
    value={formatCurrency(reportData.salesSummary.total_received)} 
    icon="money-bill-wave"
    primary
  />
  <SummaryCard 
    title="Outstanding Amount" 
    value={formatCurrency(reportData.salesSummary.outstanding_amount)} 
    icon="hand-holding-usd"
  />
  <SummaryCard 
    title="Collection Rate" 
    value={`${reportData.salesSummary.collection_rate}%`} 
    icon="percentage"
  />
</div> 