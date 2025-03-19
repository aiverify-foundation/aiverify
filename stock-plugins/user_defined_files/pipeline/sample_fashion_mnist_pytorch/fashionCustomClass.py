import torch
import torchvision
from PIL import Image


class FashionMNISTCustom(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.weights = torchvision.models.resnet.ResNet18_Weights.DEFAULT
        self.resnet = torchvision.models.resnet18(weights=self.weights)
        self.resnet.fc = torch.nn.Linear(512, 10)

    def predict(self, X):
        preprocess = self.weights.transforms()
        images = torch.stack([preprocess(Image.open(x)) for x in X])
        out: torch.Tensor = self.resnet(images)
        return out.argmax(dim=1).detach().cpu().numpy()
