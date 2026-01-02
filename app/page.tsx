import Maps from "@/components/Maps";
import PersonalizedBanner from "@/components/PersonalizedBanner";

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<PersonalizedBanner />
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900">
						Welcome to Drive Tracker
					</h2>
					<p className="text-gray-600 mt-2">
						Your location is being tracked to help analyze driving patterns and
						safety. This app monitors your speed and location in real-time.
					</p>
					<div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg
									className="h-5 w-5 text-yellow-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm text-yellow-700">
									Please allow location permissions when prompted. Your data is
									used for traffic analysis and safety monitoring.
								</p>
							</div>
						</div>
					</div>
				</div>
				<Maps />
			</div>
		</div>
	);
}
