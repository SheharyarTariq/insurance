import { useState, useEffect } from 'react';
import AddWitnessModal from './AddWitness';
import { User2, Pencil, Trash2, Loader2 } from "lucide-react";
import { getWitnesses, createWitness, type Witness as ApiWitness, deleteWitness } from '../../services/Accidents/Cards/Cards';
import { useParams } from 'react-router-dom';

interface Witness {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    statement: string;
    isIndependent: string;
}

interface WitnessesModalProps {
    isOpen: boolean;
    onClose: () => void;
    accidentId: number;
    onAddWitness: (witness: any) => void;
    onEditWitness?: (id: number) => void;
    onDeleteWitness?: (id: number) => void;
}

const WitnessesModal = ({
    isOpen,
    onClose,
    claimId,
    onAddWitness,
    onEditWitness,
    onDeleteWitness
}: WitnessesModalProps) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [witnesses, setWitnesses] = useState<Witness[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { id } = useParams()

    const fetchWitnesses = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiWitnesses = await getWitnesses(id || claimId);
            setWitnesses(apiWitnesses);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch witnesses');
            console.error('Error fetching witnesses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && (id || claimId)) {
            fetchWitnesses();
        }
    }, [isOpen, claimId]);

    const handleAddNewWitness = () => {
        setIsAddModalOpen(true);
    };

    const handleDeleteWitness = async (id: number) => {
        try {
            await deleteWitness(id)
            await fetchWitnesses()
        } catch (e) { }
    }

    const handleConfirmAddWitness = async (witnessData: any) => {
        try {
            const apiData = {
                name: `${witnessData.firstName} ${witnessData.surname}`.trim(),
                contact: witnessData.phone,
                statement: witnessData.statement || '',
                accident_detail: claimId
            };

            const response = await createWitness(apiData);

            const newWitness = {
                id: response.id || 0,
                name: response.name,
                address: witnessData.address,
                phone: witnessData.phone,
                email: witnessData.email,
                statement: response.statement,
                isIndependent: witnessData.isIndependent
            };

            onAddWitness(newWitness);
            setIsAddModalOpen(false);

            fetchWitnesses();

        } catch (error) {
            console.error('Error creating witness:', error);
            const titleMap: { [key: string]: string } = {
                mr: 'Mr.',
                mrs: 'Mrs.',
                ms: 'Ms.',
                miss: 'Miss',
                dr: 'Dr.'
            };

            const title = titleMap[witnessData.title] || '';
            const name = `${title} ${witnessData.firstName} ${witnessData.surname}`.trim();

            const fallbackWitness = {
                id: witnesses.length + 1,
                name: name,
                address: witnessData.address,
                phone: witnessData.phone,
                email: witnessData.email,
                isIndependent: witnessData.isIndependent,
                statement: witnessData.statement || ''
            };

            onAddWitness(fallbackWitness);
            setWitnesses(prev => [...prev, fallbackWitness]);
            setIsAddModalOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-xl mx-4 shadow-xl">
                    <div className="p-6">
                        <div className="flex justify-center">
                            <div className='rounded-full border-8 border-gray-300/10'>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-custom">
                                    <User2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">Witnesses Details</h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            The list of the added witnesses is below
                        </p>

                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-custom" />
                                <span className="ml-2 text-gray-600">Loading witnesses...</span>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg mb-4">
                                {error}
                                <button
                                    onClick={fetchWitnesses}
                                    className="ml-2 text-custom hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {!loading && !error && (
                            <div className="space-y-4 max-h-84 mb-2 overflow-y-auto">
                                {witnesses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No witnesses added yet
                                    </div>
                                ) : (
                                    witnesses.map((witness) => {
                                        return (
                                            <div
                                                key={witness.id}
                                                className="border-b border-gray-200 flex justify-between items-start hover:bg-gray-50 transition-colors p-2"
                                            >
                                                <div className="flex-1 mb-1">
                                                    <h4 className="font-semibold text-gray-800">
                                                        {witness.first_name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {witness.address.address}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {witness.address?.mobile_tel} • {witness?.address?.email}
                                                    </p>
                                                </div>

                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        onClick={() => onEditWitness?.(witness.id)}
                                                        className="p-2 text-gray-600 hover:text-blue-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWitness(witness.id)}
                                                        className="p-2 text-gray-600 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        <div className="flex justify-center w-full space-x-3 pt-4">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium w-full h-12"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddNewWitness}
                                className="px-5 py-2.5 bg-custom text-white rounded-lg hover:bg-[#252B37] transition-colors font-medium w-full h-12"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Add New Witness'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AddWitnessModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    fetchWitnesses()
                }}
                onConfirm={handleConfirmAddWitness}
                claimId={claimId}
            />
        </>
    );
};

export default WitnessesModal;