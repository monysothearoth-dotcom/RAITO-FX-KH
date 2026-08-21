# Public data sources used by the market-analysis panels

- FRED public CSV download and macro series: https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL,UNRATE,PAYEMS,FEDFUNDS,DGS2,DGS10
- Federal Reserve FRED overview: https://fred.stlouisfed.org/
- Binance USDⓈ-M Futures public market-data documentation: https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data
- DefiLlama public API documentation and unlocks data: https://api-docs.defillama.com/ and https://defillama.com/unlocks
- Blockchain.com public Bitcoin statistics endpoint: https://api.blockchain.info/stats
- BIS FX market survey reference used by the research library: https://www.bis.org/statistics/rpfx25.htm

Implementation notes: FRED series are observation-based and may be delayed; Binance funding/open-interest is venue-specific; Blockchain.com metrics are Bitcoin-network-only; DefiLlama unlock coverage is partial and may be unavailable. The UI must show source status and avoid implying that a missing metric is zero.
