import React, { useState } from 'react';
import { X, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { contractService } from '../src/services/contractService';

interface AirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  ticketTypes: Array<{ id: number; name: string; available: number }>;
}

const AirdropModal: React.FC<AirdropModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  ticketTypes
}) => {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [selectedTicketType, setSelectedTicketType] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
    }
  };

  const validateAddresses = (addresses: string[]): string[] => {
    return addresses.filter(addr => {
      // Basic Ethereum address validation
      return addr && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
    }).map(addr => addr.trim());
  };

  const handleSubmit = async () => {
    const validRecipients = validateAddresses(recipients);

    if (validRecipients.length === 0) {
      setError('Please enter at least one valid Ethereum address');
      return;
    }

    const selectedType = ticketTypes.find(t => t.id === selectedTicketType);
    if (!selectedType || validRecipients.length > selectedType.available) {
      setError(`Not enough tickets available. Only ${selectedType?.available || 0} tickets left for this type.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize contract with MetaMask signer
      await contractService.initializeWithMetaMask();

      // Now call airdrop
      await contractService.airdropTickets(
        parseInt(eventId),
        selectedTicketType,
        validRecipients
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRecipients(['']);
      }, 2000);

    } catch (err) {
      console.error('Airdrop failed:', err);
      setError(err instanceof Error ? err.message : 'Airdrop failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-lumina-dark border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white">Airdrop Tickets</h2>
            <p className="text-gray-400 mt-1">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ticket Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select Ticket Type
            </label>
            <select
              value={selectedTicketType}
              onChange={(e) => setSelectedTicketType(parseInt(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50"
            >
              {ticketTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.available} available)
                </option>
              ))}
            </select>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-white">
                Recipient Addresses
              </label>
              <button
                onClick={addRecipient}
                className="flex items-center gap-2 px-3 py-1 bg-lumina-glow/20 text-lumina-glow rounded-lg hover:bg-lumina-glow/30 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Recipient
              </button>
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    placeholder="0x..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lumina-glow/50 font-mono text-sm"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter valid Ethereum addresses. One ticket will be airdropped to each address.
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">
                Airdrop completed successfully! Tickets have been sent to all recipients.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || success}
              className="flex-1 px-6 py-3 bg-lumina-glow text-white font-bold rounded-xl hover:bg-lumina-glow/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Airdropping...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </>
              ) : (
                `Airdrop ${validateAddresses(recipients).length} Tickets`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirdropModal;
