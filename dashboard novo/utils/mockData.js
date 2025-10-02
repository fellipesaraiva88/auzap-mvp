const mockData = {
  // Dados do painel de impacto principal
  impactData: {
    timeRecovered: '18h 32min',
    moneySaved: '832',
    salesClosed: '47',
    workDays: '2,6'
  },
  
  // Dados dos cards de métricas
  metricsData: {
    moneyInMotion: {
      value: '3.240',
      conversations: 12
    },
    guaranteedRevenue: {
      value: '8.960',
      scheduled: 23
    },
    capacityUsage: {
      percentage: 80,
      occupied: 8,
      total: 10
    },
    freeTime: {
      hours: 4,
      minutes: 23
    }
  },
  
  // Dados dos gráficos
  chartsData: {
    workAutomation: {
      aiHandled: 82,
      humanIntervention: 18
    },
    hourlyRevenue: [
      { time: '08h', value: 340 },
      { time: '10h', value: 520 },
      { time: '12h', value: 850 },
      { time: '14h', value: 680 },
      { time: '16h', value: 340 },
      { time: '18h', value: 520 }
    ],
    capacityUsage: [
      {
        name: 'Hotel',
        percentage: 80,
        occupied: 8,
        total: 10,
        dailyRevenue: '1.600',
        color: '#3b82f6',
        waitingList: false
      },
      {
        name: 'Creche',
        percentage: 100,
        occupied: 15,
        total: 15,
        dailyRevenue: '750',
        color: '#10b981',
        waitingList: true
      }
    ]
  }
};