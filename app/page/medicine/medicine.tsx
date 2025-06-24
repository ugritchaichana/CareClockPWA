'use client'

import { useState } from 'react'

// Define the shape of the consumption time state
interface ConsumptionTimes {
  morning: boolean
  afternoon: boolean
  evening: boolean
  beforeBed: boolean
}

export default function Medicine() {
  const [medicineImage, setMedicineImage] = useState<File | null>(null)
  const [medicineDetails, setMedicineDetails] = useState('')
  const [consumptionType, setConsumptionType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [dosage, setDosage] = useState('')
  const [consumptionTimes, setConsumptionTimes] = useState<ConsumptionTimes>({
    morning: false,
    afternoon: false,
    evening: false,
    beforeBed: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedicineImage(e.target.files[0])
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setConsumptionTimes(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Handle form submission logic here
    console.log({
      medicineImage,
      medicineDetails,
      consumptionType,
      quantity,
      dosage,
      consumptionTimes,
    })
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    // Reset form or show success message
  }

  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg bg-white">
            <img 
              src="https://fcktqdzssxqvuzgdlemo.supabase.co/storage/v1/object/public/app-image//CareClockLOGO.PNG" 
              alt="CareClock Logo" 
              className="w-16 h-16 object-contain select-none"
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-1">ยาของคุณ</h1>
          <p className="text-gray-500 text-sm">กรอกข้อมูลยาเพื่อบันทึกและรับการแจ้งเตือน</p>
        </div>
          <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FFDFDF' }}>
          <div className="card-body p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Medicine Image */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-600 font-medium">รูปภาพยา</span>
                </label>
                <input 
                  type="file" 
                  onChange={handleImageChange} 
                  className="file-input file-input-bordered w-full" 
                  style={{ borderColor: '#FB929E' }}
                  accept="image/*"
                />
              </div>

              {/* Medicine Details */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-600 font-medium">รายละเอียดยา</span>
                </label>                <textarea 
                  value={medicineDetails} 
                  onChange={(e) => setMedicineDetails(e.target.value)} 
                  className="textarea textarea-bordered h-24" 
                  style={{ borderColor: '#FB929E' }}
                  placeholder="เช่น พาราเซตามอล 500 มก."
                  required
                ></textarea>
              </div>

              {/* Consumption Type */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-600 font-medium">ชนิดการกินยา</span>
                </label>
                <select 
                  value={consumptionType} 
                  onChange={(e) => setConsumptionType(e.target.value)} 
                  className="select select-bordered"
                  style={{ borderColor: '#FB929E' }}
                  required
                >
                  <option disabled value="">เลือกชนิดการกิน</option>
                  <option>ก่อนอาหาร</option>
                  <option>หลังอาหาร</option>
                  <option>พร้อมอาหาร</option>
                </select>
              </div>

              {/* Quantity & Dosage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-600 font-medium">จำนวนยา (เม็ด)</span>
                  </label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    className="input input-bordered" 
                    style={{ borderColor: '#FB929E' }}
                    placeholder="เช่น 30"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-600 font-medium">ขนาดการกิน (เม็ด/ครั้ง)</span>
                  </label>
                  <input 
                    type="number" 
                    value={dosage} 
                    onChange={(e) => setDosage(e.target.value)} 
                    className="input input-bordered" 
                    style={{ borderColor: '#FB929E' }}
                    placeholder="เช่น 1"
                    required
                  />
                </div>
              </div>

              {/* Consumption Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-600 font-medium">ช่วงเวลาของการกินยา</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-3 rounded-lg" style={{ backgroundColor: '#FFF6F6', border: '1px solid #FFDFDF' }}>
                  {Object.keys(consumptionTimes).map((time) => (
                    <label key={time} className="label cursor-pointer justify-start gap-3">
                      <input 
                        type="checkbox" 
                        name={time}
                        checked={consumptionTimes[time as keyof ConsumptionTimes]} 
                        onChange={handleTimeChange} 
                        className="checkbox"
                        style={{ 
                          accentColor: '#FB929E',
                          borderColor: '#FB929E'
                        }}
                      />
                      <span className="label-text text-gray-700">
                        {
                          {
                            morning: 'เช้า',
                            afternoon: 'กลางวัน',
                            evening: 'เย็น',
                            beforeBed: 'ก่อนนอน'
                          }[time]
                        }
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card-actions justify-center mt-6 pt-4">
                <button 
                  type="submit" 
                  className="btn w-full max-w-xs text-white shadow-lg"
                  style={{ 
                    backgroundColor: '#FB929E',
                    borderColor: '#FB929E'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading loading-spinner"></span> : 'เพิ่มยา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
