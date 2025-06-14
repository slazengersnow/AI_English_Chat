import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { AFFILIATE_LINKS } from "@/lib/constants";

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AffiliateModal({ isOpen, onClose }: AffiliateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-bounce-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0v2m0 0V8a2 2 0 002 2h4a2 2 0 002 2V6m-6 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">おすすめサービス</h3>
          <p className="text-secondary-text text-sm mb-6">
            あなたのキャリア開発により詳しくサポートできるサービスをご紹介します。
          </p>
          
          <div className="space-y-3 mb-6">
            <a 
              href={AFFILIATE_LINKS.recruit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-left hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{AFFILIATE_LINKS.recruit.name}</h4>
                  <p className="text-xs opacity-90">{AFFILIATE_LINKS.recruit.description}</p>
                </div>
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
            
            <a 
              href={AFFILIATE_LINKS.studysapuri.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-left hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{AFFILIATE_LINKS.studysapuri.name}</h4>
                  <p className="text-xs opacity-90">{AFFILIATE_LINKS.studysapuri.description}</p>
                </div>
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
          </div>
          
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            後で確認する
          </Button>
        </div>
      </div>
    </div>
  );
}
