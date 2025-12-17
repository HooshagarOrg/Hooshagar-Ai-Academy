'use client'

import { motion } from 'framer-motion'

interface Badge {
  id: string
  name: string
  name_fa: string
  description_fa: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xp_reward: number
  requirement_value?: number
}

interface BadgeCardProps {
  badge: Badge
  unlocked?: boolean
  unlockedAt?: string
  onClick?: () => void
  progress?: number
  currentXp?: number
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
}

const rarityBorders = {
  common: 'border-gray-400/50',
  rare: 'border-blue-400/50',
  epic: 'border-purple-400/50',
  legendary: 'border-yellow-400/50'
}

const rarityLabels = {
  common: 'معمولی',
  rare: 'نادر',
  epic: 'حماسی',
  legendary: 'افسانه‌ای'
}

export default function BadgeCard({
  badge,
  unlocked = false,
  unlockedAt,
  onClick,
  progress = 0,
  currentXp = 0
}: BadgeCardProps) {
  const progressPercent = badge.requirement_value 
    ? Math.min((currentXp / badge.requirement_value) * 100, 100)
    : 100

  return (
    <motion.div
      whileHover={{ scale: unlocked ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative rounded-2xl p-6 border-2 transition-all cursor-pointer
        ${unlocked 
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} ${rarityBorders[badge.rarity]}` 
          : 'bg-white/5 border-white/20 backdrop-blur-sm'
        }
        ${!unlocked && 'opacity-60 grayscale'}
      `}
    >
      {/* Rarity Badge */}
      <div className={`
        absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold
        ${unlocked 
          ? 'bg-white/20 text-white' 
          : 'bg-white/10 text-white/50'
        }
      `}>
        {rarityLabels[badge.rarity]}
      </div>

      {/* Icon */}
      <div className="text-6xl mb-4 text-center">
        {badge.icon}
      </div>

      {/* Name */}
      <h3 className={`
        text-xl font-bold text-center mb-2
        ${unlocked ? 'text-white' : 'text-white/50'}
      `}>
        {badge.name_fa}
      </h3>

      {/* Description */}
      <p className={`
        text-sm text-center mb-4 line-clamp-2
        ${unlocked ? 'text-white/80' : 'text-white/40'}
      `}>
        {badge.description_fa}
      </p>

      {/* Progress Bar (for locked badges) */}
      {!unlocked && badge.requirement_value && (
        <div className="mb-4">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
          <p className="text-xs text-white/50 text-center mt-1">
            {currentXp} / {badge.requirement_value} XP
          </p>
        </div>
      )}

      {/* XP Reward */}
      <div className={`
        flex items-center justify-center gap-2 text-sm font-bold
        ${unlocked ? 'text-yellow-300' : 'text-white/40'}
      `}>
        <span>⭐</span>
        <span>+{badge.xp_reward} XP</span>
      </div>

      {/* Unlocked Date */}
      {unlocked && unlockedAt && (
        <p className="text-xs text-white/60 text-center mt-2">
          دریافت شده: {new Date(unlockedAt).toLocaleDateString('fa-IR')}
        </p>
      )}

      {/* Lock Icon for locked badges */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl opacity-20">
            🔒
          </div>
        </div>
      )}
    </motion.div>
  )
}

