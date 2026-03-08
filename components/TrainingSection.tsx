import { Trash2 } from 'lucide-react';

export interface TrainingBlock {
    id: number;
    content: string;
    type: string;
}

interface TrainingSectionProps {
    title: string;
    icon: React.ReactNode;
    items: TrainingBlock[];
    onDelete: (id: number) => void;
}

export default function TrainingSection({ title, icon, items, onDelete }: TrainingSectionProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {icon} {title}
            </h3>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-gray-500 italic">No items added yet.</p>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:border-blue-100 transition-colors">
                            <p className="text-gray-700">{item.content}</p>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
