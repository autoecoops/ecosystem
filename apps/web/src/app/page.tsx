import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contracts-L1 | AI驅動的契約管理平台',
  description: '智能契約分析、風險評估與合規管理解決方案'
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Contracts-L1
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI驅動的契約管理與分析平台
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/auth/register" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              開始使用
            </a>
            <a 
              href="/docs" 
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition border border-blue-600"
            >
              查看文檔
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard 
            title="智能分析"
            description="使用先進的 AI 模型自動識別契約條款、評估風險"
            icon="🤖"
          />
          <FeatureCard 
            title="語義搜尋"
            description="基於語義理解的強大搜尋功能,快速找到相關契約"
            icon="🔍"
          />
          <FeatureCard 
            title="零成本部署"
            description="完全基於開源技術與免費雲端服務,降低使用門檻"
            icon="💰"
          />
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">系統狀態</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <StatusItem label="前端應用" status="running" />
            <StatusItem label="API 服務" status="checking" />
            <StatusItem label="資料庫" status="checking" />
            <StatusItem label="AI 引擎" status="checking" />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { 
  title: string; 
  description: string; 
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatusItem({ label, status }: { 
  label: string; 
  status: 'running' | 'checking' | 'error';
}) {
  const statusColors = {
    running: 'bg-green-500',
    checking: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-gray-600 capitalize">{status}</span>
      </div>
    </div>
  );
}
