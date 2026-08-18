const Loader = () => {
	return (
		<div className="coming-soon-wrapper min-h-[89vh] max-w-2xl mx-auto overflow-hidden bg-transparent">
			<div className="flex justify-center items-center">
				{/* Loader */}
				<div className="flex flex-col items-center gap-3">
					{/* Spinner */}
					<div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
				</div>
			</div>
		</div>
	);
};

export default Loader;
