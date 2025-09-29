interface Props {
  value: number;
}

export default function PortfolioValueCard({ value }: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow text-center">
      <h2 className="text-gray-500 text-sm">Total Portfolio Value</h2>
      <p className="text-3xl font-bold text-green-600">${value.toFixed(2)}</p>
    </div>
  );
}
