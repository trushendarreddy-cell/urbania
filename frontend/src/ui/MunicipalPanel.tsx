import useMunicipalStore, { TAX_RATES, TAX_EFFECTS, POLICY_EFFECTS, type TaxRate, type CityPolicy, type ServiceType } from '../store/MunicipalStore';
import { useState } from 'react';

export default function MunicipalPanel() {
  const {
    treasury,
    taxRate,
    cityPolicy,
    serviceFunding,
    dailyRevenue,
    dailyExpenses,
    dailyNet,
    setTaxRate,
    setCityPolicy,
    setServiceFunding,
  } = useMunicipalStore();

  const [activeTab, setActiveTab] = useState<'budget' | 'policies'>('budget');

  const taxRateLabels: Record<TaxRate, string> = {
    low: 'Low (5%)',
    normal: 'Normal (10%)',
    high: 'High (15%)',
  };

  const policyLabels: Record<CityPolicy, string> = {
    growth: '🌱 Growth',
    balanced: '⚖️ Balanced',
    austerity: '💰 Austerity',
  };

  const formatCurrency = (val: number) => {
    return `₹${Math.round(val).toLocaleString()}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        background: 'rgba(12, 12, 16, 0.95)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        padding: '20px 24px',
        color: '#F3F4F6',
        fontFamily: 'Inter, system-ui, sans-serif',
        maxWidth: '480px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#F9FAFB' }}>🏛️ Municipal</h2>
        <button
          onClick={() => setActiveTab(activeTab === 'budget' ? 'policies' : 'budget')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '4px 12px',
            color: '#D1D5DB',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
        >
          {activeTab === 'budget' ? '⚙️ Policies' : '💰 Budget'}
        </button>
      </div>

      {activeTab === 'budget' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Treasury</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#F9FAFB' }}>{formatCurrency(treasury)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Income</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ADE80' }}>+{formatCurrency(dailyRevenue)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Expenses</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#EF4444' }}>-{formatCurrency(dailyExpenses)}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: dailyNet >= 0 ? '#4ADE80' : '#EF4444' }}>
              Net: {dailyNet >= 0 ? '+' : ''}{formatCurrency(dailyNet)} / day
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Revenue Breakdown</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D1D5DB' }}>
              <span>Residential Tax</span>
              <span>{formatCurrency(dailyRevenue * 0.4)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D1D5DB' }}>
              <span>Commercial Tax</span>
              <span>{formatCurrency(dailyRevenue * 0.35)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D1D5DB' }}>
              <span>Industrial Tax</span>
              <span>{formatCurrency(dailyRevenue * 0.25)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Tax Rate</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(Object.keys(TAX_RATES) as TaxRate[]).map((rate) => (
                <button
                  key={rate}
                  onClick={() => setTaxRate(rate)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: taxRate === rate ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.08)',
                    background: taxRate === rate ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: taxRate === rate ? '#FFFFFF' : '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                >
                  {taxRateLabels[rate]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
              Effect: {TAX_EFFECTS[taxRate].happinessMod > 0 ? '+' : ''}{TAX_EFFECTS[taxRate].happinessMod}% happiness, {TAX_EFFECTS[taxRate].demandMod > 0 ? '+' : ''}{TAX_EFFECTS[taxRate].demandMod}% demand
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>City Policy</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(Object.keys(POLICY_EFFECTS) as CityPolicy[]).map((policy) => (
                <button
                  key={policy}
                  onClick={() => setCityPolicy(policy)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: cityPolicy === policy ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.08)',
                    background: cityPolicy === policy ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: cityPolicy === policy ? '#FFFFFF' : '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                  }}
                >
                  {policyLabels[policy]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
              Dev Pressure: {POLICY_EFFECTS[cityPolicy].devPressureMod > 0 ? '+' : ''}{POLICY_EFFECTS[cityPolicy].devPressureMod}%,
              Expenses: {Math.round((POLICY_EFFECTS[cityPolicy].expenseMod - 1) * 100)}%
              {POLICY_EFFECTS[cityPolicy].happinessMod !== 0 && `, Happiness: ${POLICY_EFFECTS[cityPolicy].happinessMod > 0 ? '+' : ''}${POLICY_EFFECTS[cityPolicy].happinessMod}%`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Service Funding</div>
            {(['healthcare', 'education', 'safety'] as ServiceType[]).map((type) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#D1D5DB', width: '80px' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={serviceFunding[type]}
                  onChange={(e) => setServiceFunding(type, Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#4ADE80' }}
                />
                <span style={{ fontSize: '12px', color: '#9CA3AF', width: '30px' }}>{Math.round(serviceFunding[type])}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}