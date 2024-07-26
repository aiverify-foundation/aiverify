from sklearn.preprocessing import LabelEncoder


class featureEngineeringStage:
    def __init__(self, columns, selection):
        self.columns = columns
        self.selection = selection

    def transform(self, X, y=None):
        """Transform columns of X using LabelEncoder."""
        output = X.copy()
        for col in self.columns:
            output[col] = LabelEncoder().fit_transform(output[col])
        return output[self.selection]

    def fit(self, X, y=None):
        return self
